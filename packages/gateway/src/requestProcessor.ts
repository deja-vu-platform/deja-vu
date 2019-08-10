import * as express from 'express';
import { ExecutionResult } from 'graphql';
import { Observable } from 'subscriptions-transport-ws';
import * as request from 'superagent';
import { v4 as uuid } from 'uuid';

import * as assert from 'assert';

import * as _ from 'lodash';

import {
  ComponentHelper,
  ComponentTable,
  ComponentTag,
  ComponentTagPath
} from './componentHelper';
import { SubscriptionCoordinator } from './subscriptionCoordinator';
import { TxConfig, TxCoordinator, Vote } from './txCoordinator';

import { ComponentPath } from './componentPath';
import { DvConfig, GatewayConfig } from './gateway.model';

import { InputValuesMap, TxInputsValidator } from './txInputsValidator';


const JSON_INDENTATION = 2;
const SUCCESS = 200;
const INTERNAL_SERVER_ERROR = 500;


export interface Dict {
  readonly [key: string]: string;
}

export interface RequestOptions {
  readonly params?: Dict;
  readonly headers?: Dict;
}

export enum Method {
  GET = 'GET',
  POST = 'POST'
}

export interface Params {
  from: string;
  runId: string;
  path?: string;
  options?: string;
}

export interface ChildRequest {
  method: Method;
  body: string | Object;
  query: Params;
}

export interface GatewayRequest {
  readonly fullComponentName: string;
  readonly from: ComponentPath;
  readonly reqId: string;
  readonly runId?: string | undefined;
  readonly path?: string | undefined;
  readonly options?: RequestOptions;
}

export interface GatewayToClicheRequest extends GatewayRequest {
  readonly url: string;
  readonly method: string;
  readonly body: string;
}

export interface ClicheResponse<T> {
  readonly status: number;
  readonly text: T;
  readonly index?: number;
}

export type port = number;

function stringify(json: any) {
  return JSON.stringify(json, undefined, JSON_INDENTATION);
}

/**
 * Class for batching responses.
 */
export class ResponseBatch {
  private responses: ClicheResponse<string>[] = [];

  constructor(private res: express.Response, private batchSize: number) { }

  /**
   * Add a response to the batch.
   * A single response is sent once we have reached the batchSize
   */
  add(status: number, text: string, index?: number): void {
    this.responses.push({
      status,
      text,
      index
    });

    if (this.responses.length === this.batchSize) {
      this.send();
    }
  }

  /**
   * Fail response
   */
  fail(status: number, text: string): void {
    this.responses = [];
    for (let i = 0; i < this.batchSize; i++) {
      this.add(status, text, i);
    }
  }

  /**
   * Send the batched response.
   */
  private send() {
    let status = this.responses[0].status;
    let body: any = this.responses[0].text;
    if (this.batchSize > 1) {
      status = this.responses
        .filter(({ status: s }) => s !== SUCCESS)
        .length === 0 ? SUCCESS : INTERNAL_SERVER_ERROR;
      body = this.responses
        .sort((a, b) => a.index - b.index)
        .map((response) => ({ status: response.status, body: response.text }));
    }
    this.res
      .status(status)
      .send(body);
  }
}


export class RequestInvalidError {
  constructor(public readonly message) {}
}

export abstract class RequestProcessor {
  protected readonly txCoordinator: TxCoordinator<
    GatewayToClicheRequest, ClicheResponse<string>, ResponseBatch>;
  protected readonly dstTable: { [cliche: string]: port } = {};
  protected readonly subscriptionCoordinator: SubscriptionCoordinator;

  private static ClicheOf(node: ComponentTag | undefined): string | undefined {
    if (node === undefined) {
      return undefined;
    }

    return _.isEmpty(node.dvOf) ? node.tag.split('-')[0] : node.dvOf!;
  }

  /**
   *  Forwards to the cliche the given request.
   */
  private static async ForwardRequest<T>(
    gatewayRequest: GatewayToClicheRequest
  ): Promise<ClicheResponse<T>> {
    let url = gatewayRequest.url;
    if (gatewayRequest.path) {
      url += gatewayRequest.path;
    }
    url +=  `/${gatewayRequest.fullComponentName}`;
    let clicheReq = request(gatewayRequest.method, url);
    if (gatewayRequest.options) {
      if (gatewayRequest.options.params) {
        clicheReq = clicheReq.query(gatewayRequest.options.params);
      }
      if (gatewayRequest.options.headers) {
        clicheReq = clicheReq.set(gatewayRequest.options.headers);
      }
    }
    clicheReq.send(gatewayRequest.body);
    let response: request.Response;
    try {
      response = await clicheReq;
    } catch (err) {
      response = err.response;
    }
    if (!response) {
      const errMsg = `Got an undefined response for cliche ` +
        `request ${stringify(clicheReq)}`;
      console.error(errMsg);

      throw new Error(errMsg);
    }

    return {
      status: response.status,
      text: RequestProcessor.JsonParse(response.text)
    };
  }

  private static NewReqFor(msg: string, gcr: GatewayToClicheRequest)
    : GatewayToClicheRequest {
    return _
      .assign({}, gcr, {
        path: `/dv-${gcr.fullComponentName}/${gcr.reqId}/${msg}` + gcr.path });
  }

  private static BuildGatewayRequest(
    req: express.Request | ChildRequest
  ): GatewayRequest {
    return {
      from: ComponentPath.fromString(req.query.from),
      fullComponentName: req.query.fullComponentName,
      reqId: uuid(),
      runId: req.query.runId,
      path: req.query.path,
      options: req.query.options ?
        RequestProcessor.JsonParse(req.query.options) : undefined
    };
  }

  private static JsonParse(value: string): any {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new Error(`Couldn't parse JSON ${value}. Reason: ${e}`);
    }
  }

  protected constructor(config: GatewayConfig) {
    const txConfig = this.getTxConfig(config);
    this.txCoordinator = new TxCoordinator<GatewayToClicheRequest,
      ClicheResponse<string>, ResponseBatch>(txConfig);
    this.subscriptionCoordinator = new SubscriptionCoordinator();
  }

  start(): Promise<void> {
    return this.txCoordinator.start();
  }

  async processRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    return req.query.isTx ?
      this.processTxRequest(req, res) :
      this.processNonTxRequest(req, res);
  }

  processSubscription(request: Object): Observable<ExecutionResult> {
    if (!request['from']) {
      throw new RequestInvalidError('No from specified');
    }
    const port = this.getToPort(ComponentPath.fromString(request['from']));
    const url = this.getUrl(port, request['path'], true);

    return this.subscriptionCoordinator.forwardRequest(url, request);
  }

  unsubscribeAll() {
    this.subscriptionCoordinator.unsubscribeAll();
  }

  protected async processTxRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const context = req.body.context;
    const childRequests: ChildRequest[] = req.body.requests;
    const resBatch = new ResponseBatch(res, childRequests.length);

    let gatewayToClicheRequests: GatewayToClicheRequest[];
    let prunedCohortComponents: ComponentTag[];
    try {
       gatewayToClicheRequests = childRequests
         .map((childRequest) => this.validateRequest(childRequest));

      const componentPath = gatewayToClicheRequests[0].from;
      const dvTxNodeIndex: number = componentPath.indexOfClosestTxNode()!;
      const cohortComponents = this.getCohortComponents(componentPath, dvTxNodeIndex);
      prunedCohortComponents = this.getPrunedCohortComponents(cohortComponents,
        childRequests.map((childRequest) =>
          ComponentPath.fromString(childRequest.query.from)
            .last()));

      const inputValuesMap: InputValuesMap = {};
      for (const childRequest of childRequests) {
        const componentFqtag = ComponentPath.fromString(childRequest.query.from)
          .last();
        // Needs to match the way we extract inputs from the request in the
        // cliche-server
        const inputs = childRequest.method === 'GET' ?
          // query.options is not parsed so we need to parse it
          _.get(JSON.parse(_.get(childRequest, 'query.options')),
            'params.inputs.input') :
          _.get(childRequest, 'body.inputs.input');

        console.log(`Got inputs ${JSON.stringify(inputs)}`);
        _.forEach(inputs, (value: any, inputName: string) => {
          _.set(inputValuesMap, [componentFqtag, inputName], value);
        });
      }

      console.log(
        `Checking with context ${JSON.stringify(context)}` +
        `Input values map ${JSON.stringify(inputValuesMap)}`);
      TxInputsValidator.Validate(inputValuesMap, prunedCohortComponents, context);
    } catch (e) {
      if (e instanceof RequestInvalidError) {
        resBatch.fail(INTERNAL_SERVER_ERROR, e.message);
      } else {
        console.log('Something bad happened' + e.message);
        throw e;
      }

      return;
    }

    return Promise
      .all(gatewayToClicheRequests
        .map((gatewayToClicheRequest, index) =>
          this.txCoordinator.processMessage(
            gatewayToClicheRequest.runId,
            gatewayToClicheRequest.from.serialize(),
            this.getCohorts(
              gatewayToClicheRequest.from.serialize(), prunedCohortComponents),
            gatewayToClicheRequest, resBatch, index)))
      .then(() => {});
  }

  protected async processNonTxRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const resBatch = new ResponseBatch(res, 1);
    try {
      const gatewayToClicheRequest = this.validateRequest(req);
      /**
       * We need to check that no other req is expected (another req could
       * be expected if this req is supposed to be part of a tx with more
       * than one cohort)
       */
      const componentPath = gatewayToClicheRequest.from;

      if (componentPath.isDvTx()) {
        const dvTxNodeIndex: number | null  = componentPath.indexOfClosestTxNode();
        console.log('Validating request of no-op tx');
        const cohortComponents = this.getCohortComponents(componentPath, dvTxNodeIndex);
        // throws error if invalid
        this.getPrunedCohortComponents(cohortComponents,
          [componentPath.last()]);
      }

      const clicheRes: ClicheResponse<string> = await RequestProcessor
        .ForwardRequest<string>(gatewayToClicheRequest);
      resBatch.add(clicheRes.status, clicheRes.text, 1);
    } catch (e) {
      resBatch.add(INTERNAL_SERVER_ERROR, e.message);
    }
  }

  protected getComponentFromPath(componentPath: ComponentPath): ComponentTag {
    const fqtag = _.last(componentPath.nodes());

    return {
      fqtag,
      tag: fqtag
    };
  }

  protected abstract getCohortComponents(
    _componentPath: ComponentPath,
    _dvTxNodeIndex: number
  ): ComponentTag[];

  protected abstract getPrunedCohortComponents(cohortComponents: ComponentTag[],
    receivedRequestFqTags: string[]): ComponentTag[];

  protected validateRequest(req: express.Request | ChildRequest)
    : GatewayToClicheRequest {
    if (!req.query.from) {
      throw new RequestInvalidError('No from specified');
    }

    const gatewayRequest = RequestProcessor.BuildGatewayRequest(req);

    const { runId, from: componentPath } = gatewayRequest;
    const toPort: port = this.getToPort(componentPath);

    console.log(`Req from ${stringify(gatewayRequest)}`);

    console.log(
      `Valid request: port: ${toPort}, ` +
      `component path: ${componentPath}, runId: ${runId}` +
      (componentPath.isDvTx() ? `, dvTxId: ${runId}` : ' not part of a tx'));

    return {
      ...gatewayRequest,
      ...{
        url: `${this.getUrl(toPort)}`,
        method: req.method,
        body: req.body
      }
    };
  }

  protected getCohorts(
    componentPathId: string, cohortComponents: ComponentTag[]): string[] {
    const componentPath: ComponentPath = ComponentPath.fromString(componentPathId);
    assert.ok(componentPath.isDvTx(),
      `Getting cohorts of an component path that is not part of a ` +
      `dv-tx: ${componentPath}`);
    const dvTxNodeIndex: number = componentPath.indexOfClosestTxNode()!;

    return _.map(cohortComponents, (component: ComponentTag) =>
      new ComponentPath([
        ..._.take(componentPath.nodes(), dvTxNodeIndex + 1),
        component.fqtag
      ]).serialize()
    );
  }

  private getToPort(componentPath: ComponentPath): port {
    const componentTag = this.getComponentFromPath(componentPath);
    const to = RequestProcessor.ClicheOf(componentTag);
    const toPort: port | undefined = _.get(this.dstTable, to);

    if (!componentTag) {
      throw new RequestInvalidError(`Invalid component path: ${componentPath}`);
    }
    if (toPort === undefined) {
      throw new RequestInvalidError(
        `Invalid to: ${to}, my dstTable is ${stringify(this.dstTable)}`);
    }

    return toPort;
  }

  private getUrl(port: port, path: string = '', isSubscription?: boolean) {
    const protocol = isSubscription ? 'ws' : 'http';

    return `${protocol}://localhost:${port}${path}`;
  }

  private getTxConfig(config: GatewayConfig):
    TxConfig<GatewayToClicheRequest, ClicheResponse<string>, ResponseBatch> {
    return {
      dbHost: config.dbHost,
      dbPort: config.dbPort,
      dbName: config.dbName,
      reinitDbOnStartup: config.reinitDbOnStartup,

      sendCommitToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
        // cohort doesn't need to commit for GET requests
        if (gcr.method === 'GET') {
          return Promise.resolve();
        }

        return RequestProcessor
          .ForwardRequest(RequestProcessor.NewReqFor('commit', gcr))
          .then((_unusedResp) => undefined);
      },

      sendAbortToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
        if (gcr.method === 'GET') {
          return Promise.resolve();
        }

        return RequestProcessor
          .ForwardRequest(RequestProcessor.NewReqFor('abort', gcr))
          .then((_unusedResp) => undefined);
      },

      sendVoteToCohort: (gcr: GatewayToClicheRequest)
        : Promise<Vote<ClicheResponse<string>>> => {
        return RequestProcessor
          .ForwardRequest<Vote<string>>(RequestProcessor.NewReqFor('vote', gcr))
          .then((resp: ClicheResponse<Vote<string>>)
            : Vote<ClicheResponse<string>> => {
            const vote = {
              result: resp.text.result,
              payload: { status: resp.status, text: resp.text.payload }
            };

            return vote;
          });
      },

      sendAbortToClient: (
        causedAbort: boolean, _gcr?: GatewayToClicheRequest,
        payload?: ClicheResponse<string>, txRes?: ResponseBatch) => {
        assert.ok(txRes !== undefined);
        if (causedAbort) {
          assert.ok(payload !== undefined);
          txRes!.add(payload!.status, payload!.text);
        } else {
          txRes!.add(
            INTERNAL_SERVER_ERROR,
            'the tx that this component is part of aborted'
          );
        }
      },

      sendToClient: (
        payload: ClicheResponse<string>,
        txRes?: ResponseBatch,
        index?: number
      ) => {
        txRes!.add(payload.status, payload.text, index);
      },

      onError: (
        e: Error, _gcr: GatewayToClicheRequest, txRes?: ResponseBatch) => {
        console.error(e);
        txRes!.add(INTERNAL_SERVER_ERROR, e.message);
      }
    };
  }
}

export class AppRequestProcessor extends RequestProcessor {
  private readonly componentHelper: ComponentHelper;

  constructor(
    config: GatewayConfig,
    dvConfig?: DvConfig,
    appComponentTable?: ComponentTable
  ) {
    super(config);

    _.forEach(dvConfig.usedCliches, (clicheConfig, name) => {
      this.dstTable[name] = clicheConfig.config.wsPort;
    });
    if (dvConfig.config) {
      this.dstTable[dvConfig.name] = dvConfig.config.wsPort;
    }
    console.log(`Using dst table ${stringify(this.dstTable)}`);

    // names of the cliches used (not the aliases), repeats don't matter
    const usedCliches: string[] = _.map(
      dvConfig.usedCliches,
      (usedClicheConfig, alias) => _.get(usedClicheConfig, 'name', alias)
    );

    const routeComponentSelectors = _.uniq(_.map(dvConfig.routes, ({component}) =>
      `${dvConfig.name}-${component}`
    ));
    this.componentHelper = new ComponentHelper(
      usedCliches, appComponentTable, routeComponentSelectors);
  }

  protected getComponentFromPath(componentPath: ComponentPath): ComponentTag {
    return this.componentHelper.getMatchingComponents(componentPath)[0];
  }

  protected getCohortComponents(componentPath: ComponentPath, dvTxNodeIndex: number) {
    const paths: ComponentTagPath[] = this.componentHelper
      .getMatchingPaths(componentPath);
    // We know that the component path is a valid one because if otherwise the
    // tx would have never been initiated in the first place
    const debugPaths = _.map(
      paths, (p) => ComponentHelper.PickComponentTagPath(p, ['fqtag']));
    assert.ok(paths.length === 1,
      `Expected 1 path but got ${paths.length} for ` +
      `${componentPath.serialize()}: ${JSON.stringify(debugPaths)}`);
    const componentTagPath: ComponentTagPath = paths[0];
    assert.ok(componentTagPath.length === componentPath.length(),
      'Expected the length of the path to match the component path ' +
      ` length but got ${stringify(componentTagPath)}`);

    const dvTxNode = componentTagPath[dvTxNodeIndex];
    assert.ok(dvTxNode !== null && dvTxNode !== undefined,
      'Expected the tx node to exist on the path');

    return _.reject(dvTxNode.content, (component: ComponentTag) =>
      component.tag.split('-')[0] === 'dv'
      || _.get(component.inputs, '[save]') === 'false'
      || !this.componentHelper.shouldHaveExecRequest(component.tag)
    );
  }

  /**
   * Get the relevant subset of cohort components based on the component tags
   * from the received requests for the cohort.
   *
   * @param  cohortComponents - all the components in the cohort
   * @param  receivedRequestFqTags - the component tags received as a batch
   *                                     for the cohort
   * @return cohort components s.t. those not present in receivedRequestFqTags
   *                        are excluded
   * @throws RequestInvalidError if there are components not present in
   *         receivedRequestFqTags, but those requests are not optional; or
   *         if there are more requests for an fqtag received than expected; or
   *         if there are fqtags received that are not part of the cohort at all
   */
  protected getPrunedCohortComponents(cohortComponents: ComponentTag[],
    receivedRequestFqTags: string[]): ComponentTag[] {
    const fqTagsSet: Set<string> = new Set(receivedRequestFqTags);
    if (fqTagsSet.size < receivedRequestFqTags.length) {
      throw new RequestInvalidError('Got multiple requests from at least one ' +
        'fqtag');
    }
    const prunedCohortComponents: ComponentTag[] = [];

    for (const component of cohortComponents) {
      const componentRequestExists = fqTagsSet.has(component.fqtag);

      if (!componentRequestExists &&
        !this.componentHelper.isRequestOptional(component.tag)) {
        throw new RequestInvalidError(`Did not get any requests from ` +
        `${component.fqtag} and ${component.tag}'s request is not optional`);
      }

      if (componentRequestExists) {
        prunedCohortComponents.push(component);
      }
    }

    if (prunedCohortComponents.length < receivedRequestFqTags.length) {
      throw new RequestInvalidError('Received requests include components that ' +
        'that are not part of the cohort');
    }

    return prunedCohortComponents;
  }
}

export class DesignerRequestProcessor extends RequestProcessor {
  private cohortComponents: ComponentTag[]; // for appless mode only

  constructor(config: GatewayConfig) {
    super(config);
  }

  /**
   * Add a cliche (for appless mode for the designer)
   */
  addCliche(name: string, wsPort: port, alias?: string) {
    this.dstTable[alias || name] = wsPort;
  }

  /**
   * Remove a cliche (for appless mode for the designer)
   */
  removeCliche(name: string, alias?: string) {
    delete this.dstTable[alias || name];
  }

  protected async processTxRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const childRequests: ChildRequest[] = req.body.requests;

    // the cohorts cannot be determined from the (nonexistent) component table
    // so we get them from the paths in the request
    // I think this is actually not safe because we only save one set of cohorts
    // but this is designer only where problematic fast requesting is unlikely
    this.cohortComponents = childRequests.map((chReq) => {
      const componentPath = ComponentPath.fromString(chReq.query.from);
      const fqtag = componentPath.nodes()[componentPath.indexOfClosestTxNode() + 1];

      return {
        fqtag,
        tag: fqtag,
        inputs: {}
      };
    });

    // this is the same as in the app version except we skip input validation
    const resBatch = new ResponseBatch(res, childRequests.length);
    let gatewayToClicheRequests: GatewayToClicheRequest[];
    try {
      gatewayToClicheRequests = childRequests
        .map((childRequest) => this.validateRequest(childRequest));
    } catch (e) {
      resBatch.fail(INTERNAL_SERVER_ERROR, e.message);
    }

    // same as in the app version
    return Promise
      .all(gatewayToClicheRequests
        .map((gatewayToClicheRequest, index) =>
          this.txCoordinator.processMessage(
            gatewayToClicheRequest.runId,
            gatewayToClicheRequest.from.serialize(),
            this.getCohorts(
              gatewayToClicheRequest.from.serialize(), this.cohortComponents),
            gatewayToClicheRequest, resBatch, index)))
      .then(() => {});
  }

  protected getCohortComponents(
    _componentPath: ComponentPath,
    _dvTxNodeIndex: number
  ): ComponentTag[] {
    return this.cohortComponents;
  }

  protected getPrunedCohortComponents(_cohortComponents: ComponentTag[],
    _receivedRequestFqTags: string[]): ComponentTag[] {
    return this.cohortComponents;
  }
}

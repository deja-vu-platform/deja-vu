import * as express from 'express';
import { ExecutionResult } from 'graphql';
import { Observable } from 'subscriptions-transport-ws';
import * as request from 'superagent';
import { v4 as uuid } from 'uuid';

import * as assert from 'assert';

import * as _ from 'lodash';

import {
  ActionHelper,
  ActionTable,
  ActionTag,
  ActionTagPath
} from './actionHelper';
import { SubscriptionCoordinator } from './subscriptionCoordinator';
import { TxConfig, TxCoordinator, Vote } from './txCoordinator';

import { ActionPath } from './actionPath';
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
  readonly fullActionName: string;
  readonly from: ActionPath;
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

  private static ClicheOf(node: ActionTag | undefined): string | undefined {
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
    url +=  `/${gatewayRequest.fullActionName}`;
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
        path: `/dv-${gcr.fullActionName}/${gcr.reqId}/${msg}` + gcr.path });
  }

  private static BuildGatewayRequest(
    req: express.Request | ChildRequest
  ): GatewayRequest {
    return {
      from: ActionPath.fromString(req.query.from),
      fullActionName: req.query.fullActionName,
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
    const port = this.getToPort(ActionPath.fromString(request['from']));
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
    try {
       gatewayToClicheRequests = childRequests
         .map((childRequest) => this.validateRequest(childRequest));

      const actionPath = gatewayToClicheRequests[0].from;
      const dvTxNodeIndex: number = actionPath.indexOfClosestTxNode()!;
      const cohortActions = this.getCohortActions(actionPath, dvTxNodeIndex);
      const inputValuesMap: InputValuesMap = {};
      for (const childRequest of childRequests) {
        const actionFqtag = ActionPath.fromString(childRequest.query.from)
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
          _.set(inputValuesMap, [actionFqtag, inputName], value);
        });
      }

      console.log(
        `Checking with context ${JSON.stringify(context)}` +
        `Input values map ${JSON.stringify(inputValuesMap)}`);
      TxInputsValidator.Validate(inputValuesMap, cohortActions, context);
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
      const clicheRes: ClicheResponse<string> = await RequestProcessor
        .ForwardRequest<string>(gatewayToClicheRequest);
      resBatch.add(clicheRes.status, clicheRes.text, 1);
    } catch (e) {
      resBatch.add(INTERNAL_SERVER_ERROR, e.message);
    }
  }

  protected getActionFromPath(actionPath: ActionPath): ActionTag {
    const fqtag = _.last(actionPath.nodes());

    return {
      fqtag,
      tag: fqtag
    };
  }

  protected abstract getCohortActions(
    _actionPath: ActionPath,
    _dvTxNodeIndex: number
  ): ActionTag[];

  protected validateRequest(req: express.Request | ChildRequest)
    : GatewayToClicheRequest {
    if (!req.query.from) {
      throw new RequestInvalidError('No from specified');
    }

    const gatewayRequest = RequestProcessor.BuildGatewayRequest(req);

    const { runId, from: actionPath } = gatewayRequest;
    const toPort: port = this.getToPort(actionPath);

    console.log(`Req from ${stringify(gatewayRequest)}`);

    console.log(
      `Valid request: port: ${toPort}, ` +
      `action path: ${actionPath}, runId: ${runId}` +
      (actionPath.isDvTx() ? `, dvTxId: ${runId}` : ' not part of a tx'));

    return {
      ...gatewayRequest,
      ...{
        url: `${this.getUrl(toPort)}`,
        method: req.method,
        body: req.body
      }
    };
  }

  private getToPort(actionPath: ActionPath): port {
    const actionTag = this.getActionFromPath(actionPath);
    const to = RequestProcessor.ClicheOf(actionTag);
    const toPort: port | undefined = _.get(this.dstTable, to);

    if (!actionTag) {
      throw new RequestInvalidError(`Invalid action path: ${actionPath}`);
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
            'the tx that this action is part of aborted'
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

      getCohorts: (actionPathId: string): string[] => {
        const actionPath: ActionPath = ActionPath.fromString(actionPathId);
        assert.ok(actionPath.isDvTx(),
          `Getting cohorts of an action path that is not part of a ` +
          `dv-tx: ${actionPath}`);
        const dvTxNodeIndex: number = actionPath.indexOfClosestTxNode()!;
        const cohortActions = this.getCohortActions(actionPath, dvTxNodeIndex);

        return _.map(cohortActions, (action: ActionTag) =>
          new ActionPath([
            ..._.take(actionPath.nodes(), dvTxNodeIndex + 1),
            action.fqtag
          ]).serialize()
        );
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
  private readonly actionHelper: ActionHelper;

  constructor(
    config: GatewayConfig,
    dvConfig?: DvConfig,
    appActionTable?: ActionTable
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

    const routeActionSelectors = _.uniq(_.map(dvConfig.routes, ({action}) =>
      `${dvConfig.name}-${action}`
    ));
    this.actionHelper = new ActionHelper(
      usedCliches, appActionTable, routeActionSelectors);
  }

  protected getActionFromPath(actionPath: ActionPath): ActionTag {
    return this.actionHelper.getMatchingActions(actionPath)[0];
  }

  protected getCohortActions(actionPath: ActionPath, dvTxNodeIndex: number) {
    const paths: ActionTagPath[] = this.actionHelper
      .getMatchingPaths(actionPath);
    // We know that the action path is a valid one because if otherwise the
    // tx would have never been initiated in the first place
    const debugPaths = _.map(
      paths, (p) => ActionHelper.PickActionTagPath(p, ['fqtag']));
    assert.ok(paths.length === 1,
      `Expected 1 path but got ${paths.length} for ` +
      `${actionPath.serialize()}: ${JSON.stringify(debugPaths)}`);
    const actionTagPath: ActionTagPath = paths[0];
    assert.ok(actionTagPath.length === actionPath.length(),
      'Expected the length of the path to match the action path ' +
      ` length but got ${stringify(actionTagPath)}`);

    const dvTxNode = actionTagPath[dvTxNodeIndex];
    assert.ok(dvTxNode !== null && dvTxNode !== undefined,
      'Expected the tx node to exist on the path');

    return _.reject(dvTxNode.content, (action: ActionTag) =>
      action.tag.split('-')[0] === 'dv'
      || _.get(action.inputs, '[save]') === 'false'
      || !this.actionHelper.shouldHaveExecRequest(action.tag)
    );
  }

}

export class DesignerRequestProcessor extends RequestProcessor {
  private cohortActions: ActionTag[]; // for appless mode only

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

    // the cohorts cannot be determined from the (nonexistent) action table
    // so we get them from the paths in the request
    // I think this is actually not safe because we only save one set of cohorts
    // but this is designer only where problematic fast requesting is unlikely
    this.cohortActions = childRequests.map((chReq) => {
      const actionPath = ActionPath.fromString(chReq.query.from);
      const fqtag = actionPath.nodes()[actionPath.indexOfClosestTxNode() + 1];

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
            gatewayToClicheRequest, resBatch, index)))
      .then(() => {});
  }

  protected getCohortActions(
    _actionPath: ActionPath,
    _dvTxNodeIndex: number
  ): ActionTag[] {
    return this.cohortActions;
  }
}

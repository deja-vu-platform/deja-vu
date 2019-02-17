import * as express from 'express';
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
import { TxConfig, TxCoordinator, Vote } from './txCoordinator';

import { ActionPath } from './actionPath';
import { DvConfig, GatewayConfig } from './gateway.model';


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

enum Method {
  GET = 'GET',
  POST = 'POST'
}

interface Params {
  from: string;
  runId: string;
  path?: string;
  options?: string;
}

interface ChildRequest {
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
 * Class for batching transaction responses.
 * Also just sends a regular response for batchSize === 1
 */
export class TxResponse {
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


export abstract class RequestProcessor {
  private readonly txCoordinator: TxCoordinator<
    GatewayToClicheRequest, ClicheResponse<string>, TxResponse>;
  protected readonly dstTable: { [cliche: string]: port } = {};

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
      console.error(
        `Got an undefined response for cliche request
      ${stringify(clicheReq)}`);
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

  private static HasRunId(gatewayRequest: GatewayRequest) {
    const runId = gatewayRequest.runId;

    return !(_.isEmpty(runId) || runId === 'null' || runId === 'undefined');
  }

  constructor(config: GatewayConfig) {
    const txConfig = this.getTxConfig(config);
    this.txCoordinator = new TxCoordinator<GatewayToClicheRequest,
      ClicheResponse<string>, TxResponse>(txConfig);
  }

  start(): Promise<void> {
    return this.txCoordinator.start();
  }

  async processRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    return this._processRequest(req, res);
  }

  protected async _processRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    if (!req.query.isTx) {
      return this.doProcessRequest(req, new TxResponse(res, 1), 1);
    }

    const childRequests: ChildRequest[] = req.body;
    const txRes = new TxResponse(res, childRequests.length);

    return Promise
      .all(childRequests.map((chReq, index) =>
        this.doProcessRequest(chReq, txRes, index)))
      .then(() => {});
  }

  protected getActionFromPath(actionPath: ActionPath): ActionTag {
    const fqtag = _.last(actionPath.nodes());

    return {
      fqtag,
      tag: fqtag
    };
  }

  private validateRequest(
    actionPath: ActionPath,
    matchingAction: ActionTag,
    to: string,
    toPort: port,
    txRes: TxResponse
  ) {
    if (!matchingAction) {
      txRes.add(
        INTERNAL_SERVER_ERROR,
        `Invalid action path: ${actionPath}`
      );

      return false;
    }
    if (toPort === undefined) {
      txRes.add(
        INTERNAL_SERVER_ERROR,
        `Invalid to: ${to}, my dstTable is ${stringify(this.dstTable)}`
      );

      return false;
    }

    return true;
  }

  private async doProcessRequest(
    req: express.Request | ChildRequest,
    txRes: TxResponse,
    index: number
  ): Promise<void> {
    if (!req.query.from) {
      txRes.add(INTERNAL_SERVER_ERROR, 'No from specified');

      return;
    }

    const gatewayRequest = RequestProcessor.BuildGatewayRequest(req);

    const { runId, from: actionPath } = gatewayRequest;
    const actionTag = this.getActionFromPath(actionPath);
    const to = RequestProcessor.ClicheOf(actionTag);
    const toPort: port | undefined = _.get(this.dstTable, to);

    console.log(`Req from ${stringify(gatewayRequest)}`);
    if (!this.validateRequest(actionPath, actionTag, to, toPort, txRes)) {
        return;
    }

    console.log(
      `Processing request: port: ${toPort}, ` +
      `action path: ${actionPath}, runId: ${runId}` +
      (actionPath.isDvTx() ? `, dvTxId: ${runId}` : ' not part of a tx'));

    const gatewayToClicheRequest: GatewayToClicheRequest = {
      ...gatewayRequest,
      ...{
        url: `http://localhost:${toPort}`,
        method: req.method,
        body: req.body
      }
    };
    /*
     * For a request to be part of a exec tx, two things must happen:
     *  - it must have a `runId` (all actions that get executed get a run id,
     *    independently of whether they are part of a tx or not)
     *  - the action path must be a dv-tx path (if it isn't, then it is a
     *    request that was caused by an exec but it is not part of a dv-tx)
     */
    if (RequestProcessor.HasRunId(gatewayRequest) && actionPath.isDvTx()) {
      await this.txCoordinator.processMessage(
        runId!, actionPath.serialize(), gatewayToClicheRequest, txRes, index);
    } else {
      const clicheRes: ClicheResponse<string> = await RequestProcessor
        .ForwardRequest<string>(gatewayToClicheRequest);
      txRes.add(clicheRes.status, clicheRes.text, index);
    }
  }

  protected getTxConfig(config: GatewayConfig):
    TxConfig<GatewayToClicheRequest, ClicheResponse<string>, TxResponse> {
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
        payload?: ClicheResponse<string>, txRes?: TxResponse) => {
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
        txRes?: TxResponse,
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
        e: Error, _gcr: GatewayToClicheRequest, txRes?: TxResponse) => {
        console.error(e);
        txRes!.add(INTERNAL_SERVER_ERROR, e.message);
      }
    };
  }

  protected abstract getCohortActions(
    _actionPath: ActionPath,
    _dvTxNodeIndex: number
  ): ActionTag[];

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

    const routesWithSelectors = _.map(dvConfig.routes, (r) => ({
      path: r.path,
      action: `${dvConfig.name}-${r.action}`
    }));
    this.actionHelper = new ActionHelper(
      usedCliches, appActionTable, routesWithSelectors);
  }

  protected getActionFromPath(actionPath: ActionPath): ActionTag {
    return this.actionHelper.getMatchingActions(actionPath)[0];
  }

  protected getCohortActions(actionPath: ActionPath, dvTxNodeIndex: number) {
    const paths: ActionTagPath[] = this.actionHelper
      .getMatchingPaths(actionPath);
    // We know that the action path is a valid one because if otherwise the
    // tx would have never been initiated in the first place
    assert.ok(paths.length === 1,
      `Expected 1 path but got ${stringify(paths)}`);
    const actionTagPath: ActionTagPath = paths[0];
    assert.ok(actionTagPath.length === actionPath.length(),
      'Expected the length of the path to match the action path ' +
      ` length but got ${stringify(actionTagPath)}`);

    const dvTxNode = actionTagPath[dvTxNodeIndex];

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

  async processRequest(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    if (req.query.isTx) {
      const childRequests: ChildRequest[] = req.body;
      this.cohortActions = childRequests.map((chReq) => {
        const actionPath = ActionPath.fromString(chReq.query.from);
        const fqtag = actionPath.nodes()[actionPath.indexOfClosestTxNode() + 1];

        return {
          fqtag,
          tag: fqtag,
          inputs: {}
        };
      });
    }
    this._processRequest(req, res);
  }

  protected getCohortActions(
    _actionPath: ActionPath,
    _dvTxNodeIndex: number
  ): ActionTag[] {
    return this.cohortActions;
  }
}

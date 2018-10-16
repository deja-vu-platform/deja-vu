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
const INTERNAL_SERVER_ERROR = 500;


interface Dict {
  readonly [key: string]: string;
}

interface RequestOptions {
  readonly params?: Dict;
  readonly headers?: Dict;
}

interface GatewayRequest {
  readonly from: ActionPath;
  readonly reqId: string;
  readonly runId?: string | undefined;
  readonly path?: string | undefined;
  readonly options?: RequestOptions;
}

interface GatewayToClicheRequest extends GatewayRequest {
  readonly url: string;
  readonly method: string;
  readonly body: string;
}

interface ClicheResponse<T> {
  readonly status: number;
  readonly text: T;
}

type port = string;

export class RequestProcessor {
  private readonly txCoordinator: TxCoordinator<
    GatewayToClicheRequest, ClicheResponse<string>, express.Response>;
  private readonly actionHelper: ActionHelper;
  private readonly dstTable: { [cliche: string]: port };

  private static ClicheOf(node: ActionTag | undefined): string | undefined {
    if (node === undefined) {
      return undefined;
    }

    return _.isEmpty(node.dvOf) ? node.tag.split('-')[0] : node.dvOf!;
  }

  /**
   *  Forwards to the cliche the given request.
   */
  private static async ForwardRequest<T>(gatewayRequest: GatewayToClicheRequest)
    : Promise<ClicheResponse<T>> {
    let url = gatewayRequest.url;
    if (gatewayRequest.path) {
      url += gatewayRequest.path;
    }
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
      ${JSON.stringify(clicheReq)}`);
    }

    return { status: response.status, text: JSON.parse(response.text) };
  }

  private static NewReqFor(msg: string, gcr: GatewayToClicheRequest)
    : GatewayToClicheRequest {
    return _
      .assign({}, gcr, { path: `/dv/${gcr.reqId}/${msg}` + gcr.path });
  }

  private static BuildGatewayRequest(req): GatewayRequest {
    return {
      from: ActionPath.fromString(req.query.from),
      reqId: uuid(),
      runId: req.query.runId,
      path: req.query.path,
      options: req.query.options ? JSON.parse(req.query.options) : undefined
    };
  }

  constructor(
    dvConfig: DvConfig, config: GatewayConfig, appActionTable: ActionTable) {
    const usedCliches = _
      .chain(dvConfig.usedCliches)
      .toPairs()
      .map(([alias, usedClicheConfig]: [string, DvConfig]): string => _
          .get(usedClicheConfig, 'name', alias))
      .value();
    this.actionHelper = new ActionHelper(
      appActionTable, usedCliches, dvConfig.routes);

    const usedClicheServers = _
      .mapValues(
        dvConfig.usedCliches,
        (clicheConfig: DvConfig) => clicheConfig.config.wsPort);
    const thisServer = (dvConfig.config !== undefined) ?
      { [dvConfig.name]: dvConfig.config.wsPort } : {};
    this.dstTable = _.assign({}, usedClicheServers, thisServer);
    console.log(`Using dst table ${JSON.stringify(this.dstTable)}`);

    const txConfig = this.getTxConfig(config, this.actionHelper);
    this.txCoordinator = new TxCoordinator<
      GatewayToClicheRequest, ClicheResponse<string>, express.Response>(
        txConfig);
  }

  start(): Promise<void> {
    return this.txCoordinator
      .start()
      .then((_unused) => {
        console.log(`Using action table ${this.actionHelper}`);
      });
  }

  async processRequest(req: express.Request, res: express.Response)
    : Promise<void> {
    if (!req.query.from) {
      res.status(INTERNAL_SERVER_ERROR)
        .send('No from specified');

      return;
    }
    const gatewayRequest = RequestProcessor.BuildGatewayRequest(req);

    const runId = gatewayRequest.runId;
    const actionPath = gatewayRequest.from;
    const matchingActions = this.actionHelper.getMatchingActions(actionPath);
    const to = RequestProcessor.ClicheOf(matchingActions[0]);
    const toPort: port | undefined = _.get(this.dstTable, to);

    console.log(`Req from ${stringify(gatewayRequest)}`);
    if (!this.validateRequest(actionPath, matchingActions, to, toPort, res)) {
      return;
    }

    console.log(
      `Processing request: port: ${toPort}, ` +
      `action path: ${actionPath}, runId: ${runId}` +
      (actionPath.isDvTx() ? `, dvTxId: ${runId}` : ' not part of a tx'));

    const gatewayToClicheRequest = {
      ...gatewayRequest,
      ...{
        url: `http://localhost:${toPort}`,
        method: req.method,
        body: req.body
      }
    };

    if (req.method === 'GET' || !actionPath.isDvTx()) {
      const clicheRes: ClicheResponse<string> = await RequestProcessor
        .ForwardRequest<string>(gatewayToClicheRequest);
      res.status(clicheRes.status);
      res.send(clicheRes.text);
    } else {
      if (!runId) {
        throw new Error('run id undefined');
      }

      await this.txCoordinator.processMessage(
        runId, actionPath.serialize(), gatewayToClicheRequest, res);
    }
  }

  private validateRequest(
    actionPath: ActionPath, matchingActions: ActionTag[],
    to: string | undefined, toPort: string | undefined, res)
    : boolean {
    if (_.isEmpty(matchingActions)) {
      res.status(INTERNAL_SERVER_ERROR)
        .send(
          `Invalid action path: ${actionPath}, my actionConfig is ` +
          this.actionHelper.toString());

      return false;
    }

    if (toPort === undefined) {
      res.status(INTERNAL_SERVER_ERROR)
        .send(`Invalid to: ${to}, my dstTable is ${stringify(this.dstTable)}`);

      return false;
    }

    return true;
  }

  private getTxConfig(config: GatewayConfig, actionHelper: ActionHelper):
    TxConfig<GatewayToClicheRequest, ClicheResponse<string>, express.Response> {
    return {
      dbHost: config.dbHost,
      dbPort: config.dbPort,
      dbName: config.dbName,
      reinitDbOnStartup: config.reinitDbOnStartup,

      sendCommitToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
        return RequestProcessor
          .ForwardRequest(RequestProcessor.NewReqFor('commit', gcr))
          .then((_unusedResp) => undefined);
      },

      sendAbortToCohort: (gcr: GatewayToClicheRequest): Promise<void> => {
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
            console.log(`Voted: ${stringify(vote)}`);

            return vote;
          });
      },

      sendAbortToClient: (
        causedAbort: boolean, gcr?: GatewayToClicheRequest,
        payload?: ClicheResponse<string>, res?: express.Response) => {
        assert.ok(res !== undefined);
        if (causedAbort) {
          assert.ok(payload !== undefined);
          res!.status(payload!.status);
          res!.send(payload!.text);
        } else {
          res!.status(INTERNAL_SERVER_ERROR);
          res!.send('the tx that this action is part of aborted');
        }
      },

      sendToClient: (
        payload: ClicheResponse<string>, res?: express.Response) => {
        res!.status(payload.status);
        res!.send(payload.text);
      },

      getCohorts: (actionPathId: string): string[] => {
        const actionPath: ActionPath = ActionPath.fromString(actionPathId);
        assert.ok(actionPath.isDvTx());
        const dvTxNodeIndex: number = actionPath.indexOfTxNode()!;

        const paths: ActionTagPath[] = actionHelper
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

        const cohortActions = _
          .reject(dvTxNode.content, (action: ActionTag) => {
            return action.tag.split('-')[0] === 'dv' ||
              _.get(action.inputs, '[save]') === 'false' ||
              !actionHelper.shouldHaveExecRequest(action.tag);
          });

        const cohorts = _
          .map(cohortActions, (action: ActionTag) => {
            const nodes = [
              ..._.take(actionPath.nodes(), dvTxNodeIndex + 1), action.fqtag
            ];

            return new ActionPath(nodes)
              .serialize();
          });

        return cohorts;
      },

      onError: (
        e: Error, gcr: GatewayToClicheRequest, res?: express.Response) => {
        console.error(e);
        res!.status(INTERNAL_SERVER_ERROR);
        res!.send(e.message);
      }
    };
  }
}


function stringify(json: any) {
  return JSON.stringify(json, undefined, JSON_INDENTATION);
}

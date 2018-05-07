import * as bodyParser from 'body-parser';
import * as express from 'express';
import { readFileSync } from 'fs';
import * as minimist from 'minimist';
import * as mongodb from 'mongodb';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';

import { graphiqlExpress, graphqlExpress  } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';


interface EventDoc {
  id: string;
  startDate: Date;
  endDate: Date;
  pending?: PendingDoc;
}

interface SeriesDoc {
  id: string;
  startsOn: Date;
  endsOn: Date;
  events: EventDoc[];
  pending?: PendingDoc;
}

interface PendingDoc {
  reqId: string;
  type: 'create-event' | 'update-event' | 'delete-event' |
    'delete-series-event' | 'create-series';
}

interface GraphQlEvent extends EventDoc {
  series?: SeriesDoc;
}

interface CreateEventInput {
  id: string;
  startDate: number;
  endDate: number;
}

interface UpdateEventInput {
  id: string;
  startDate?: number;
  endDate?: number;
}

interface CreateSeriesInput {
  id?: string;
  events: CreateEventInput[];
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
  reinitDbOnStartup: boolean;
}

const CONCURRENT_UPDATE_ERROR = 'An error has occured. Please try again later';

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'event';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`,
  reinitDbOnStartup: true
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db: mongodb.Db;
// Stores individual events that are not part of any series
let events: mongodb.Collection<EventDoc>,
// Stores event series. Its constituent events are embedded in `SeriesDoc`
    series: mongodb.Collection<SeriesDoc>;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, async (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
    if (config.reinitDbOnStartup) {
      await db.dropDatabase();
      console.log(`Reinitialized db ${config.dbName}`);
    }
    events = db.collection('events');
    events.createIndex({ id: 1 }, { unique: true });
    series = db.collection('series');
    series.createIndex({ id: 1 }, { unique: true });
    // The same event can't be part of more than one series
    series.createIndex({ 'events.id': 1 }, { unique: true });
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

class Validation {
  static async eventExistsOrFail(id: string): Promise<void> {
    const evt: EventDoc | null = await events
      .findOne({ id: id }, { projection: { _id: 1 } });
    if (evt === null) {
      throw new Error(`Event ${id} doesn't exist `);
    }
  }

  static async eventExistsInSeriesOrFail(id: string): Promise<void> {
    const s: SeriesDoc | null = await series
      .findOne({ 'events.id': id }, { projection: { _id: 1 } });
    if (s === null) {
      throw new Error(`Event ${id} doesn't exist `);
    }
  }
}


interface Context {
  reqType: 'vote' | 'commit' | 'abort' | undefined;
  runId: string;
  reqId: string;
}

function isPendingCreate(doc: EventDoc | SeriesDoc | null) {
  const docPending = _.get(doc, 'pending.type');

  return docPending === 'create-event' || docPending === 'create-series';
}

const resolvers = {
  Query: {
    events: () => events.find({ pending: { $exists: false } })
      .toArray(),
    series: () => series.find({ pending: { $exists: false } })
      .toArray(),
    event: async (root, { id }) => {
      const evt: EventDoc | null = await events.findOne({ id: id });
      if (isPendingCreate(evt)) {
        return null;
      }

      return evt;
    },
    oneSeries: async (root, { id }) => {
      const s: SeriesDoc | null = await series.findOne({ id: id });
      if (isPendingCreate(s)) {
        return null;
      }

      return s;
    }
  },
  Event: {
    id: (evt: EventDoc) => evt.id,
    startDate: (evt: EventDoc) => dateToUnixTime(evt.startDate),
    endDate: (evt: EventDoc) => dateToUnixTime(evt.endDate),
    series: (evt: EventDoc | GraphQlEvent ) => ('series' in evt) ?
      (evt as GraphQlEvent).series : undefined
  },
  Series: {
    id: (oneSeries: SeriesDoc) => oneSeries.id,
    startsOn: (oneSeries: SeriesDoc) => dateToUnixTime(oneSeries.startsOn),
    endsOn: (oneSeries: SeriesDoc) => dateToUnixTime(oneSeries.endsOn),
    events: (oneSeries: SeriesDoc) => _.map(oneSeries.events, (e) => {
      e.series = oneSeries;

      return e;
    })
  },
  Mutation: {
    createEvent: async (
      root, { input }: { input: CreateEventInput }, context: Context) => {
      const eventId = input.id ? input.id : uuid();
      const e: EventDoc = {
        id: eventId,
        startDate: unixTimeToDate(input.startDate),
        endDate: unixTimeToDate(input.endDate)
      };

      switch (context.reqType) {
        case 'vote':
          e.pending = { reqId: context.reqId, type: 'create-event' };
          /* falls through */
        case undefined:
          await events.insertOne(e);

          return e;
        case 'commit':
          await events.updateOne(
            { 'pending.reqId': context.reqId },
            { $unset: { _pending: '' } });

          return;
        case 'abort':
          await events.deleteOne({ 'pending.reqId': context.reqId });

          return;
      }

      return e;
    },
    updateEvent: async (
      root, { input }: { input: UpdateEventInput }, context: Context) => {
      const setObject: { startDate?: Date, endDate?: Date } = {};
      if (input.startDate) {
        setObject.startDate = unixTimeToDate(input.startDate);
      }
      if (input.endDate) {
        setObject.endDate = unixTimeToDate(input.endDate);
      }
      if (_.isEmpty(setObject)) {
        return false;
      }
      const updateOp = { $set: setObject };
      switch (context.reqType) {
        case 'vote':
          await Validation.eventExistsOrFail(input.id);
          const pendingUpdateObj = await events
            .updateOne(
              {
                id: input.id,
                pending: { $exists: false }
              },
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'update-event'
                  }
                }
              });
          if (pendingUpdateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case undefined:
          await Validation.eventExistsOrFail(input.id);
          const updateObj = await events
            .updateOne(
              {
                id: input.id,
                pending: { $exists: false }
              },
              updateOp);
          if (updateObj.matchedCount === 0) {
            throw new Error(CONCURRENT_UPDATE_ERROR);
          }

          return true;
        case 'commit':
          await events.updateOne(
            { 'pending.reqId': context.reqId },
            { ...updateOp, $unset: { pending: '' } });

          return;
        case 'abort':
          await events.updateOne(
            { 'pending.reqId': context.reqId }, { $unset: { pending: '' } });

          return;
      }
    },
    deleteEvent: async (root, { id }, context: Context) => {
      const isPartOfSeries: boolean = await events
        .findOne({ id: id }, { projection: { _id: 1 }}) === null;
      if (isPartOfSeries) {
        const updateOp = { $pull: { events: { id: id } } };
        switch (context.reqType) {
          case 'vote':
            await Validation.eventExistsInSeriesOrFail(id);
            const pendingUpdateObj = await series.updateOne(
              { 'events.id': id, pending: { $exists: false } },
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'delete-series-event'
                  }
                }
              });

            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await Validation.eventExistsInSeriesOrFail(id);
            const updateObj = await series.updateOne(
              { 'events.id': id, pending: { $exists: false} }, updateOp);

            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await series.updateOne(
              { 'pending.reqId': context.reqId },
              { ...updateOp, $unset: { pending: '' } });

            return;
          case 'abort':
            await series.updateOne(
              { 'pending.reqId': context.reqId }, { $unset: { pending: '' } });

            return;
        }

        // https://github.com/Microsoft/TypeScript/issues/19423
        return;
      } else {
        switch (context.reqType) {
          case 'vote':
            await Validation.eventExistsOrFail(id);
            const pendingUpdateObj = await series.updateOne(
              { 'events.id': id, pending: { $exists: false } },
              {
                $set: {
                  pending: {
                    reqId: context.reqId,
                    type: 'delete-event'
                  }
                }
              });

            if (pendingUpdateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case undefined:
            await Validation.eventExistsOrFail(id);
            const res = await events
              .deleteOne({ id: id, pending: { $exists: false } });

            if (res.deletedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await events.deleteOne({ 'pending.reqId': context.reqId });

            return;
          case 'abort':
            await events.updateOne(
              { 'pending.reqId': context.reqId }, { $unset: { pending: '' } });

            return;
        }

        // https://github.com/Microsoft/TypeScript/issues/19423
        return;
      }
    },
    createSeries: async (
      root, { input }: { input: CreateSeriesInput }, context: Context)
      : Promise<SeriesDoc | undefined> => {
      if (_.isEmpty(input.events)) {
        throw new Error('Series has no events');
      }
      let pending: PendingDoc | undefined;
      switch (context.reqType) {
        case 'vote':
          pending = { reqId: context.reqId, type: 'create-series' };
          /* falls through */
        case undefined:
          const evts: EventDoc[] = [];
          const seriesId = input.id ? input.id : uuid();
          for (const createEvent of input.events) {
            const eventId = createEvent.id ? createEvent.id : uuid();
            const e = {
              id: eventId,
              startDate: unixTimeToDate(createEvent.startDate),
              endDate: unixTimeToDate(createEvent.endDate)
            };
            evts.push(e);
          }
          const sortedInserts = _.sortBy(evts, 'startDate');
          const newSeries: SeriesDoc = {
            id: seriesId,
            startsOn: _.first(sortedInserts).startDate,
            endsOn: _.last(sortedInserts).startDate,
            events: evts
          };
          if (pending) {
            newSeries.pending = pending;
          }

          await series.insertOne(newSeries);

          return newSeries;
        case 'commit':
          await series.updateOne(
            { 'pending.reqId': context.reqId },
            { $unset: { pending: '' } });

          return;
        case 'abort':
          await series.deleteOne({ 'pending.reqId': context.reqId });

          return;
      }
    }
  }
};

const MS_IN_S = 1000;

// The JS Date object uses milliseconds since the Unix Epoch instead of
// seconds
function unixTimeToDate(unixTime: string | number): Date {
  return new Date(Number(unixTime) * MS_IN_S);
}

function dateToUnixTime(date: Date): number {
  return date.valueOf() / MS_IN_S;
}

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();

app.post(/^\/dv\/(.*)\/(vote|commit|abort)\/.*/,
  (req, res, next) => {
    req['reqId'] = req.params[0];
    req['reqType'] = req.params[1];
    next();
  },
  bodyParser.json(),
  graphqlExpress((req) => {
    return {
      schema: schema,
      context: {
        reqType: req!['reqType'],
        reqId: req!['reqId']
      },
      formatResponse: (gqlResp) => {
        const reqType = req!['reqType'];
        switch (reqType) {
          case 'vote':
            return {
              result: (gqlResp.errors) ? 'no' : 'yes',
              payload: gqlResp
            };
          case 'abort':
          case 'commit':
            return 'ACK';
          case undefined:
            return gqlResp;
        }
      }
    };
  })
);

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});

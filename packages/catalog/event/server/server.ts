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
}

interface SeriesDoc {
  id: string;
  startsOn: Date;
  endsOn: Date;
  events: EventDoc[];
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


const resolvers = {
  Query: {
    events: () => events.find()
      .toArray(),
    series: () => series.find()
      .toArray(),
    event: (root, { id }) => events.findOne({ id: id }),
    oneSeries: (root, { id }) => series.findOne({ id: id })
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
    createEvent: async (root, { input }: { input: CreateEventInput }) => {
      const eventId = input.id ? input.id : uuid();
      const e = {
        id: eventId,
        startDate: unixTimeToDate(input.startDate),
        endDate: unixTimeToDate(input.endDate)
      };

      await events.insertOne(e);

      return e;
    },
    updateEvent: async (root, { input }: { input: UpdateEventInput }) => {
      const setObject: { startDate?: Date, endDate?: Date } = {};
      if (input.startDate) {
        setObject.startDate = unixTimeToDate(input.startDate);
      }
      if (input.endDate) {
        setObject.endDate = unixTimeToDate(input.endDate);
      }
      if (!_.isEmpty(setObject)) {
        await events.updateOne({ id: input.id }, { $set: setObject });
      }

      return true;
    },
    deleteEvent: async (root, { id }) => {
      const res = await events.deleteOne({ id: id });
      if (res.deletedCount === 0) { // Might be an event that's part of a series
        const seriesUpdate = { $pull: { events: { id: id } } };
        const update = await series
          .updateOne({ 'events.id': id }, seriesUpdate);

        return update.result.nModified === 1;
      }

      return true;
    },
    createSeries: async (root, { input }: { input: CreateSeriesInput })
    : Promise<SeriesDoc> => {
      if (_.isEmpty(input.events)) {
        throw new Error('Series has no events');
      }
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

      await series.insertOne(newSeries);

      return newSeries;
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

app.use('/graphql', bodyParser.json(), bodyParser.urlencoded({
  extended: true
}), graphqlExpress({ schema }));

app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(config.wsPort, () => {
  console.log(`Running ${name} with config ${JSON.stringify(config)}`);
});

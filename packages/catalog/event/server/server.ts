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
  seriesId?: string;
}

interface SeriesDoc {
  id: string;
  startsOn: Date;
  endsOn: Date;
  eventIds: string[];
}

interface CreateEventInput {
  id: string;
  startDate: number;
  endDate: number;
}

interface UpdateEventInput {
  id: string;
  startDate: number;
  endDate: number;
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
let events: mongodb.Collection<EventDoc>, series: mongodb.Collection<SeriesDoc>;
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
    id: (event: EventDoc) => event.id,
    startDate: (event: EventDoc) => dateToUnixTime(event.startDate),
    endDate: (event: EventDoc) => dateToUnixTime(event.endDate),
    series: (event: EventDoc) => series
      .findOne({ id: event.seriesId })
  },
  Series: {
    id: (series: SeriesDoc) => series.id,
    startsOn: (series: SeriesDoc) => dateToUnixTime(series.startsOn),
    endsOn: (series: SeriesDoc) => dateToUnixTime(series.endsOn),
    events: (series: SeriesDoc) => events
      .find({ id: { $in: series.eventIds } })
      .sort({ startDate: 1 })
      .toArray()
  },
  Mutation: {
    createEvent: async (root, {input}: {input: CreateEventInput}) => {
      const eventId = input.id ? input.id : uuid();
      const e = {
        id: eventId,
        startDate: unixTimeToDate(input.startDate),
        endDate: unixTimeToDate(input.endDate)
      };

      await events.insertOne(e);

      return e;
    },
    updateEvent: async (root, {input}: {input: UpdateEventInput}) => {
      const updateObj = { $set: {
        startDate: unixTimeToDate(input.startDate),
        endDate: unixTimeToDate(input.endDate)
      } };

      await events.updateOne({id: input.id}, updateObj);

      return true;
    },
    // If a seriesId is given, the event is removed from that weekly event
    deleteEvent: async (root, { id }) => {
      const res = await events.findOneAndDelete({id: id});
      const deletedEvent = res.value;
      if (!deletedEvent) {
        return false;
      }
      if (deletedEvent.seriesId) {
        const seriesUpdate = { $pull: { events: {id: id} } };
        await series
          .updateMany({id: deletedEvent.seriesId}, seriesUpdate);
      }

      return true;
    },
    createSeries: async (root, {input}: {input: CreateSeriesInput})
    : Promise<SeriesDoc> => {
      if (_.isEmpty(input.events)) {
        throw new Error('Series has no events');
      }
      const inserts: EventDoc[] = [];
      const seriesId = input.id ? input.id : uuid();
      for (const createEvent of input.events) {
        const eventId = createEvent.id ? createEvent.id : uuid();
        const e = {
          id: eventId,
          startDate: unixTimeToDate(createEvent.startDate),
          endDate: unixTimeToDate(createEvent.endDate),
          seriesId: seriesId
        };
        inserts.push(e);
      }
      const sortedInserts = _.sortBy(inserts, 'startDate');
      const newSeries: SeriesDoc = {
        id: seriesId,
        startsOn: _.first(sortedInserts).startDate,
        endsOn: _.last(sortedInserts).startDate,
        eventIds: _.map(sortedInserts, 'id')
      };

      await Promise
        .all([ events.insertMany(sortedInserts), series.insertOne(newSeries)]);

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

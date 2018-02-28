import * as minimist from 'minimist';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as mongodb from 'mongodb';
import { v4 as uuid } from 'uuid';
import { readFileSync } from 'fs';
import * as path from 'path';

const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');


interface EventDoc {
  id: string;
  startDate: string;
  endDate: string;
  weeklyEventId?: string;
}

interface WeeklyEventDoc {
  id: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
  eventIds: string[];
}


interface CreateEventInput {
  id: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
}

interface UpdateEventInput {
  id: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
}

interface CreateWeeklyEventInput {
  id?: string;
  startsOn: string;
  endsOn: string;
  startTime: string;
  endTime: string;
}

interface Config {
  wsPort: number;
  dbHost: string;
  dbPort: number;
  dbName: string;
}

const argv = minimist(process.argv);

const name = argv.as ? argv.as : 'event';

const DEFAULT_CONFIG: Config = {
  dbHost: 'localhost',
  dbPort: 27017,
  wsPort: 3000,
  dbName: `${name}-db`
};

let configArg;
try {
  configArg = JSON.parse(argv.config);
} catch (e) {
  throw new Error(`Couldn't parse config ${argv.config}`);
}

const config: Config = {...DEFAULT_CONFIG, ...configArg};

console.log(`Connecting to mongo server ${config.dbHost}:${config.dbPort}`);
let db;
mongodb.MongoClient.connect(
  `mongodb://${config.dbHost}:${config.dbPort}`, (err, client) => {
    if (err) {
      throw err;
    }
    db = client.db(config.dbName);
  });


const typeDefs = [readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8')];

const resolvers = {
  Query: {
    events: () => db.collection('events').find().toArray(),
    weeklyEvents: () => db.collection('weeklyevents').find().toArray(),
    event: (root, { id }) => db.collection('events').findOne({ id: id }),
    weeklyEvent: (root, { id }) => db.collection('weeklyevents').findOne({ id: id })
  },
  Event: {
    id: (event: EventDoc) => event.id,
    startDate: (event: EventDoc) => event.startDate,
    endDate: (event: EventDoc) => event.endDate,
    weeklyEvent: (event: EventDoc) => db.collection('weeklyevents')
      .findOne({ id: event.weeklyEventId })
  },
  WeeklyEvent: {
    id: (weeklyEvent: WeeklyEventDoc) => weeklyEvent.id,
    startsOn: (weeklyEvent: WeeklyEventDoc) => weeklyEvent.startsOn,
    endsOn: (weeklyEvent: WeeklyEventDoc) => weeklyEvent.endsOn,
    events: (weeklyEvent: WeeklyEventDoc) => db.collection('events')
      .find({ id: { $in: weeklyEvent.eventIds } }).toArray()
  },
  Mutation: {
    createEvent: async (root, {input}: {input: CreateEventInput}) => {
      const {startDate, endDate} = getStartAndEndDates(input);
      const eventId = uuid();
      const e = { id: eventId, startDate: startDate, endDate: endDate };
      await db.collection('events').insertOne(e);
      return e;
    },
    updateEvent: async (root, {input}: {input: UpdateEventInput}) => {
      const {startDate, endDate} = getStartAndEndDates(input);
      const updateObj = { $set: { startDate: startDate, endDate: endDate } };
      await db.collection('events').updateOne({id: input.id}, updateObj);
      return true;
    },
    // If a weeklyEventId is given, the event is removed from that weekly event
    deleteEvent: async (root, {id}) => {
      const res = await db.collection('events').findOneAndDelete({id: id});
      const deletedEvent = res.value;
      if (deletedEvent.weeklyEventId) {
        const updatedWeeklyEvent = { $pull: { events: {id: id} } };
        await db.collection('weeklyevents')
          .update({id: deletedEvent.weeklyEventId}, updatedWeeklyEvent);
      }
      return true;
    },
    createWeeklyEvent: async (
      root, {input}: {input: CreateWeeklyEventInput}) => {
      const startsOnDate = new Date(Number(input.startsOn));
      const endsOnDate = new Date(Number(input.endsOn));

      const inserts: Promise<any>[] = [];
      const eventIds: string[] = [];
      const weeklyEventId = input.id ? input.id : uuid();

      const startHhMm = getHhMm(input.startTime);
      const endHhMm = getHhMm(input.endTime);
      for (
        const eventDate = startsOnDate; eventDate <= endsOnDate;
        eventDate.setDate(eventDate.getDate() + 7)) {

        const startDate = new Date(eventDate.getTime());
        startDate.setHours(startHhMm.hh, startHhMm.mm);

        const endDate = new Date(eventDate.getTime());
        endDate.setHours(endHhMm.hh, endHhMm.mm);

        const eventId = uuid();
        eventIds.push(eventId);
        const e: EventDoc = {
          id: eventId,
          startDate: startDate.toString(),
          endDate: endDate.toString(),
          weeklyEventId: weeklyEventId
        };
        inserts.push(db.collection('events').insertOne(e));
      }

      const weeklyEvent: WeeklyEventDoc = {
        id: weeklyEventId,
        eventIds: eventIds,
        startsOn: input.startsOn,
        endsOn: input.endsOn,
        startTime: input.startTime,
        endTime: input.endTime
      };
      await Promise.all(inserts);
      await db.collection('weeklyevents').insertOne(weeklyEvent);
      return weeklyEvent;
    }
  }
};

function getStartAndEndDates(input: CreateEventInput | UpdateEventInput)
  : {startDate: string, endDate: string} {
  const startsOnDate = new Date(input.startsOn);
  const endsOnDate = new Date(input.endsOn);

  const startHhMm = getHhMm(input.startTime);
  const endHhMm = getHhMm(input.endTime);

  startsOnDate.setHours(startHhMm.hh, startHhMm.mm);
  endsOnDate.setHours(endHhMm.hh, endHhMm.mm);
  return { startDate: startsOnDate.toString(), endDate: endsOnDate.toString() };
}

// Get the hours and minutes in 24-hour format from a time in 12-hr format
// (hh:mm AM/PM)
function getHhMm(hhMmTime: string): {hh: number, mm: number} {
  const hhMm = hhMmTime.slice(0, -2).split(':');
  const ret = {hh: Number(hhMm[0]), mm: Number(hhMm[1])};
  if (hhMmTime.slice(-2) === 'PM') {
    ret.hh = ret.hh + 12;
  }
  return ret;
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

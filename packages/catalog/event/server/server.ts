import {
  ActionRequestTable,
  ClicheDb,
  ClicheDbNotFoundError,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import {
  CreateEventInput,
  CreateSeriesInput,
  EventDoc,
  GraphQlEvent,
  SeriesDoc,
  UpdateEventInput
} from './schema';

import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';


const MS_IN_S = 1000;

// The JS Date object uses milliseconds since the Unix Epoch instead of
// seconds
function unixTimeToDate(unixTime: string | number): Date {
  return new Date(Number(unixTime) * MS_IN_S);
}

function dateToUnixTime(date: Date): number {
  return date.valueOf() / MS_IN_S;
}

const actionRequestTable: ActionRequestTable = {
  'choose-and-show-series': (extraInfo) => {
    switch (extraInfo.action) {
      case 'all-series':
        return `
          query ChooseAndShowSeries {
            series ${getReturnFields(extraInfo)}
          }
        `;
      case 'one-series':
        return `
          query ChooseAndShowSeries($id: ID!) {
            oneSeries(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  },
  'create-event': (extraInfo) => `
    mutation CreateEvent($input: CreateEventInput!) {
      createEvent (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-series': (extraInfo) => `
    mutation CreateSeries($input: CreateSeriesInput!) {
      createSeries (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'create-weekly-series': (extraInfo) => `
    mutation CreateSeries($input: CreateSeriesInput!) {
      createSeries (input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-event': (extraInfo) => `
    mutation DeleteEvent($id: ID!) {
      deleteEvent (id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-event': (extraInfo) => `
    query ShowEvent($id: ID!) {
      event(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-events': (extraInfo) => `
    query ShowEvents($input: EventsInput!) {
      events(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-event-count': (extraInfo) => `
    query ShowEventCount($input: EventsInput!) {
      eventCount(input: $input) ${getReturnFields(extraInfo)}
    }
  `
};

function resolvers(db: ClicheDb, _config: Config): object {
  const events: Collection<EventDoc> = db.collection('events');
  const series: Collection<SeriesDoc> = db.collection('series');

  return {
    Query: {
      // TODO: search between dates
      events: async () => await events.find(),
      series: async () => await series.find(),
      event: async (_root, { id }) => await events.findOne({ id: id }),
      oneSeries: async (_root, { id }) => await series.findOne({ id: id })
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
        return {
          id: e.id,
          startDate: e.startDate,
          endDate: e.endDate,
          series: oneSeries
        };
      })
    },
    Mutation: {
      createEvent: async (
        _root, { input }: { input: CreateEventInput }, context: Context) => {
        const eventId = input.id ? input.id : uuid();
        const e: EventDoc = {
          id: eventId,
          startDate: unixTimeToDate(input.startDate),
          endDate: unixTimeToDate(input.endDate)
        };

        return await events.insertOne(context, e);
      },
      updateEvent: async (
        _root, { input }: { input: UpdateEventInput }, context: Context) => {
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

        return await events.updateOne(context, { id: input.id }, updateOp);
      },
      deleteEvent: async (_root, { id }, context: Context) => {
        let isPartOfSeries = false;
        try {
          await events.findOne({ id: id }, { projection: { _id: 1 }});
        } catch (err) {
          if (err.errorCode !== ClicheDbNotFoundError.ERROR_CODE) {
            throw err;
          }
          isPartOfSeries = true;
        }

        if (isPartOfSeries) {
          const filter = { 'events.id': id };
          const updateOp = { $pull: { events: { id: id } } };

          return await series.updateOne(context, filter, updateOp);
        } else {
          return await events.deleteOne(context, { id: id });
        }
      },
      createSeries: async (
        _root, { input }: { input: CreateSeriesInput }, context: Context)
        : Promise<SeriesDoc | undefined> => {
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

        return await series.insertOne(context, newSeries);
      }
    }
  };
}

const eventCliche: ClicheServer = new ClicheServerBuilder('event')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    // Stores individual events that are not part of any series
    const events: Collection<EventDoc> = db.collection('events');
    // Stores event series. Its constituent events are embedded in `SeriesDoc`
    const series: Collection<SeriesDoc> = db.collection('series');

    return Promise.all([
      events.createIndex({ id: 1 }, { unique: true }),
      series.createIndex({ id: 1 }, { unique: true }),
      // The same event can't be part of more than one series
      series.createIndex({ 'events.id': 1 }, { unique: true })
    ]);
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

eventCliche.start();

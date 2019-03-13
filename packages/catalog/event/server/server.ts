import {
  ActionRequestTable,
  ClicheServer,
  ClicheServerBuilder,
  CONCURRENT_UPDATE_ERROR,
  Config,
  Context,
  getReturnFields,
  Validation
} from '@deja-vu/cliche-server';
import {
  CreateEventInput,
  CreateSeriesInput,
  EventDoc,
  GraphQlEvent,
  PendingDoc,
  SeriesDoc,
  UpdateEventInput
} from './schema';

import * as _ from 'lodash';
import * as mongodb from 'mongodb';
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

class EventValidation {
  static async eventExistsOrFail(
    events: mongodb.Collection<EventDoc>, id: string): Promise<EventDoc> {
    return Validation.existsOrFail(events, id, 'Event');
  }

  static async eventExistsInSeriesOrFail(
    series: mongodb.Collection<SeriesDoc>, id: string): Promise<void> {
    const s: SeriesDoc | null = await series
      .findOne({ 'events.id': id }, { projection: { _id: 1 } });
    if (s === null) {
      throw new Error(`Event ${id} doesn't exist `);
    }
  }
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

function isPendingCreate(doc: EventDoc | SeriesDoc | null) {
  const docPending = _.get(doc, 'pending.type');

  return docPending === 'create-event' || docPending === 'create-series';
}

function resolvers(db: mongodb.Db, _config: Config): object {
  const events: mongodb.Collection<EventDoc> = db.collection('events');
  const series: mongodb.Collection<SeriesDoc> = db.collection('series');

  return {
    Query: {
      // TODO: search between dates
      events: () => events.find({ pending: { $exists: false } })
        .toArray(),
      series: () => series.find({ pending: { $exists: false } })
        .toArray(),
      event: async (_root, { id }) => {
        const evt: EventDoc | null = await events.findOne({ id: id });
        if (isPendingCreate(evt)) {
          return null;
        }

        return evt;
      },
      oneSeries: async (_root, { id }) => {
        const s: SeriesDoc | null = await series.findOne({ id: id });
        if (isPendingCreate(s)) {
          return null;
        }

        return s;
      },
      // TODO: search between dates
      eventCount: () => events.count({ pending: { $exists: false } })
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

        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            e.pending = { reqId: context.reqId, type: 'create-event' };
            /* falls through */
          case undefined:
            await events.insertOne(e);

            return e;
          case 'commit':
            await events.updateOne(
              reqIdPendingFilter,
              { $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await events.deleteOne(reqIdPendingFilter);

            return undefined;
        }

        return e;
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
        const notPendingEventFilter = {
          id: input.id,
          pending: { $exists: false }
        };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        switch (context.reqType) {
          case 'vote':
            await EventValidation.eventExistsOrFail(events, input.id);
            const pendingUpdateObj = await events
              .updateOne(
                notPendingEventFilter,
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
            await EventValidation.eventExistsOrFail(events, input.id);
            const updateObj = await events
              .updateOne(notPendingEventFilter, updateOp);
            if (updateObj.matchedCount === 0) {
              throw new Error(CONCURRENT_UPDATE_ERROR);
            }

            return true;
          case 'commit':
            await events.updateOne(
              reqIdPendingFilter,
              { ...updateOp, $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await events.updateOne(
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
        }

        return undefined;
      },
      deleteEvent: async (_root, { id }, context: Context) => {
        const isPartOfSeries: boolean = await events
          .findOne({ id: id }, { projection: { _id: 1 }}) === null;
        const notPendingEventsFilter = { pending: { $exists: false } };
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
        if (isPartOfSeries) {
          notPendingEventsFilter['events.id'] = id;
          const updateOp = { $pull: { events: { id: id } } };

          switch (context.reqType) {
            case 'vote':
              await EventValidation.eventExistsInSeriesOrFail(series, id);
              const pendingUpdateObj = await series.updateOne(
                notPendingEventsFilter,
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
              await EventValidation.eventExistsInSeriesOrFail(series, id);
              const updateObj = await series.updateOne(
                notPendingEventsFilter, updateOp);

              if (updateObj.matchedCount === 0) {
                throw new Error(CONCURRENT_UPDATE_ERROR);
              }

              return true;
            case 'commit':
              await series.updateOne(
                reqIdPendingFilter,
                { ...updateOp, $unset: { pending: '' } });

              return undefined;
            case 'abort':
              await series.updateOne(
                reqIdPendingFilter, { $unset: { pending: '' } });

              return undefined;
          }

          // https://github.com/Microsoft/TypeScript/issues/19423
          return undefined;
        } else {
          _.set(notPendingEventsFilter, 'id', id);

          switch (context.reqType) {
            case 'vote':
              await EventValidation.eventExistsOrFail(events, id);
              const pendingUpdateObj = await events.updateOne(
                notPendingEventsFilter,
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
              await EventValidation.eventExistsOrFail(events, id);
              const res = await events
                .deleteOne({ id: id, pending: { $exists: false } });

              if (res.deletedCount === 0) {
                throw new Error(CONCURRENT_UPDATE_ERROR);
              }

              return true;
            case 'commit':
              await events.deleteOne(reqIdPendingFilter);

              return undefined;
            case 'abort':
              await events.updateOne(
                reqIdPendingFilter, { $unset: { pending: '' } });

              return undefined;
          }

          // https://github.com/Microsoft/TypeScript/issues/19423
          return undefined;
        }
      },
      createSeries: async (
        _root, { input }: { input: CreateSeriesInput }, context: Context)
        : Promise<SeriesDoc | undefined> => {
        if (_.isEmpty(input.events)) {
          throw new Error('Series has no events');
        }
        const reqIdPendingFilter = { 'pending.reqId': context.reqId };
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
              reqIdPendingFilter, { $unset: { pending: '' } });

            return undefined;
          case 'abort':
            await series.deleteOne(reqIdPendingFilter);

            return undefined;
        }

        return undefined;
      }
    }
  };
}

const eventCliche: ClicheServer = new ClicheServerBuilder('event')
  .initDb((db: mongodb.Db, _config: Config): Promise<any> => {
    // Stores individual events that are not part of any series
    const events: mongodb.Collection<EventDoc> = db.collection('events');
    // Stores event series. Its constituent events are embedded in `SeriesDoc`
    const series: mongodb.Collection<SeriesDoc> = db.collection('series');

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

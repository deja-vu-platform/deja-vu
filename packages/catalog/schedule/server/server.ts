import {
  ActionRequestTable,
  ClicheDb,
  ClicheServer,
  ClicheServerBuilder,
  Collection,
  Config,
  Context,
  getReturnFields
} from '@deja-vu/cliche-server';
import {
  AllAvailabilityInput,
  CreateScheduleInput,
  NextAvailabilityInput,
  ScheduleDoc,
  SlotDoc,
  SlotsInput,
  UpdateScheduleInput
} from './schema';

import { areRangesOverlapping, isAfter, isBefore } from 'date-fns';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';


// each action should be mapped to its corresponding GraphQl request here
const actionRequestTable: ActionRequestTable = {
  'create-schedule': (extraInfo) => `
    mutation CreateSchedule($input: CreateScheduleInput!) {
      createSchedule(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'delete-schedule': (extraInfo) => `
    mutation DeleteSchedule($id: ID!) {
      deleteSchedule(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-all-availability': (extraInfo) => `
    query ShowAllAvailability($input: AllAvailabilityInput!) {
      allAvailability(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-next-availability': (extraInfo) => `
    query ShowNextAvailability($input: NextAvailabilityInput!) {
      nextAvailability(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'show-schedule': (extraInfo) => `
    query ShowSchedule($id: ID!) {
      schedule(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-slot': (extraInfo) => `
    query ShowSlot($id: ID!) {
      slot(id: $id) ${getReturnFields(extraInfo)}
    }
  `,
  'show-slots': (extraInfo) => `
    query ShowSlots($input: SlotsInput!) {
      slots(input: $input) ${getReturnFields(extraInfo)}
    }
  `,
  'update-schedule': (extraInfo) => {
    switch (extraInfo.action) {
      case 'update':
        return `
          mutation UpdateSchedule($input: UpdateScheduleInput!) {
            updateSchedule (input: $input) ${getReturnFields(extraInfo)}
          }
        `;
      case 'load':
        return `
          query Schedule($id: ID!) {
            schedule(id: $id) ${getReturnFields(extraInfo)}
          }
        `;
      default:
        throw new Error('Need to specify extraInfo.action');
    }
  }
};

function getLaterStart(first: SlotDoc, second: SlotDoc): Date {
  const comparison = isAfter(first.startDate, second.startDate);

  return comparison ? first.startDate : second.startDate;
}

function getEarlierEnd(first: SlotDoc, second: SlotDoc): Date {
  const comparison = isBefore(first.endDate, second.endDate);

  return comparison ? first.endDate : second.endDate;
}

function getSlotsPipeline(matchQuery: any, filterCondition: any,
  sortByStartDate: number, sortByEndDate: number) {
  return [
    { $match: matchQuery },
    {
      $project: {
        availability: {
          $filter: {
            input: '$availability',
            as: 'slot',
            cond: filterCondition
          }
        }
      }
    },
    {
      $sort: {
        'availability.startDate': sortByStartDate,
        'availability.endDate': sortByEndDate
      }
    }
  ];
}

function resolvers(db: ClicheDb, _config: Config): object {
  const schedules: Collection<ScheduleDoc> = db.collection('schedules');

  return {
    Query: {
      schedule: async (_root, { id }) => await schedules.findOne({ id }),

      slot: async (_root, { id }) => {
        const schedule = await schedules.findOne(
          { 'availability.id': id },
          { projection: { 'availability.$': 1 } }
        );

        if (_.isEmpty(schedule!.availability)) {
          throw new Error(`Slot ${id} does not exist`);
        }

        return schedule!.availability[0];
      },

      slots: async (_root, { input }: { input: SlotsInput }) => {
        const filter = { id: input.scheduleId };
        const condition = {};
        if (!_.isNil(input.startDate)) {
          condition['$gte'] = ['$$slot.startDate', new Date(input.startDate)];
        }
        if (!_.isNil(input.endDate)) {
          condition['$lte'] = ['$$slot.endDate', new Date(input.endDate)];
        }

        const res = await schedules
          .aggregate(getSlotsPipeline(filter, condition, input.sortByStartDate,
            input.sortByEndDate))
          .next();

        return res ? res.availability : [];
      },

      nextAvailability: async (
        _root, { input }: { input: NextAvailabilityInput }) => {
        // assume between two schedules
        const matchQuery = { id: { $in: input.scheduleIds } };
        const filterCondition = { $gte: ['$$slot.startDate', new Date()] };

        const pipeline = getSlotsPipeline(matchQuery, filterCondition, 1, 1);

        const res = await schedules.aggregate(pipeline)
          .toArray();

        let next: SlotDoc;

        if (!_.isEmpty(res) && res.length === 2) {
          const firstScheduleSlots = res[0].availability;
          const secondScheduleSlots = res[1].availability;

          firstScheduleSlots.some((first) => {
            secondScheduleSlots.some((second) => {

              if (areRangesOverlapping(
                first.startDate, first.endDate,
                second.startDate, second.endDate)) {
                next = {
                  id: uuid(),
                  startDate: getLaterStart(first, second),
                  endDate: getEarlierEnd(first, second)
                };
              }

              return !_.isNil(next);
            });

            return !_.isNil(next);
          });
        }

        return next;
      },

      allAvailability: async (
        _root, { input }: { input: AllAvailabilityInput }) => {
        // assume between two schedules
        const matchQuery = { id: { $in: input.scheduleIds } };
        const filterCondition = {
          $gte: [
            '$$slot.startDate',
            input.startDate ? new Date(input.startDate) : new Date()
          ]
        };

        if (!_.isNil(input.endDate)) {
          filterCondition['$lte'] = ['$$slot.endDate', new Date(input.endDate)];
        }

        const pipeline = getSlotsPipeline(matchQuery, filterCondition,
          input.sortByStartDate, input.sortByEndDate);

        const res = await schedules.aggregate(pipeline)
          .toArray();

        const overlaps: SlotDoc[] = [];

        if (!_.isEmpty(res) && res.length === 2) {
          const firstScheduleSlots = res[0].availability;
          const secondScheduleSlots = res[1].availability;

          firstScheduleSlots.forEach((first) => {
            secondScheduleSlots.forEach((second) => {

              if (areRangesOverlapping(
                first.startDate, first.endDate,
                second.startDate, second.endDate)) {

                overlaps.push({
                  id: uuid(),
                  startDate: getLaterStart(first, second),
                  endDate: getEarlierEnd(first, second)
                });
              }
            });
          });
        }

        return overlaps;
      }
    },

    Schedule: {
      id: (schedule: ScheduleDoc) => schedule.id,
      availability: (schedule: ScheduleDoc) => schedule.availability
    },

    Slot: {
      id: (slot: SlotDoc) => slot.id,
      startDate: (slot: SlotDoc) => slot.startDate.toISOString(),
      endDate: (slot: SlotDoc) => slot.endDate.toISOString()
    },

    Mutation: {
      createSchedule: async (
        _root, { input }: { input: CreateScheduleInput }, context: Context) => {
        let availability = [];
        if (!_.isNil(input.slots)) {
          availability = _.map(input.slots, (slot) => {
            const dateSlot: SlotDoc = {
              id: uuid(),
              startDate: new Date(slot.startDate),
              endDate: new Date(slot.endDate)
            };

            return dateSlot;
          });
        }
        const schedule: ScheduleDoc = {
          id: input.id ? input.id : uuid(),
          availability: availability
        };

        return await schedules.insertOne(context, schedule);
      },

      updateSchedule: async (
        _root, { input }: { input: UpdateScheduleInput }, context: Context) => {
        const filter = { id: input.id };
        let addSlotsSuccess = true;
        let deleteSlotsSuccess = true;

        // StackOverflow post for doing two updates: https://bit.ly/2IJIVZR
        // add slots
        if (!_.isNil(input.add) && !_.isEmpty(input.add)) {
          const availability = _.map(input.add, (slot) => {
            const newSlot: SlotDoc = {
              id: uuid(),
              startDate: new Date(slot.startDate),
              endDate: new Date(slot.endDate)
            };

            return newSlot;
          });
          const updateOp = { $push: { availability: { $each: availability } } };
          addSlotsSuccess = await schedules
            .updateOne(context, filter, updateOp);
        }

        // delete slots
        if (!_.isNil(input.delete) && !_.isEmpty(input.delete)) {
          const updateOp = {
            $pull: { availability: { id: { $in: input.delete } } }
          };
          deleteSlotsSuccess = await schedules
            .updateOne(context, filter, updateOp);
        }

        return addSlotsSuccess && deleteSlotsSuccess;
      },

      deleteSchedule: async (_root, { id }, context: Context) =>
        await schedules.deleteOne(context, { id })
    }
  };
}

const scheduleCliche: ClicheServer = new ClicheServerBuilder('schedule')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const schedules: Collection<ScheduleDoc> = db.collection('schedules');

    return schedules.createIndex({ id: 1 }, { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

scheduleCliche.start();

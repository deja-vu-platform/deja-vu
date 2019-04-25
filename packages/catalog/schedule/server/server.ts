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

function getAggregatedAvailableSlotsPipeline(matchQuery: any,
  nextAvailability = false) {
  const pipeline: any = [
    { $match: matchQuery },
    {
      $group: {
        _id: 0,
        availability: { $push: '$availability' }
      }
    },
    {
      $project: {
        availability: {
          $reduce: {
            input: '$availability',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] }
          }
        }
      }
    },
    { $sort: { 'availability.startDate': 'asc' } }
  ];

  if (nextAvailability) {
    pipeline.push({ $limit: 1 });
  }

  return pipeline;
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
        if (!_.isNil(input.startDate)) {
          filter['availability.startDate']['$gte'] = new Date(input.startDate);
        }
        if (!_.isNil(input.endDate)) {
          filter['availability.endDate']['$lte'] = new Date(input.endDate);
        }

        const slots = await schedules.findOne(filter,
          { projection: { availability: 1 } });

        return slots.availability;
      },

      nextAvailability: async (
        _root, { input }: { input: NextAvailabilityInput }) => {
        const filter = {
          id: { $in: input.scheduleIds },
          'availability.startDate': { $gte: new Date() }
        };

        const res = await schedules
          .aggregate(getAggregatedAvailableSlotsPipeline(filter, true))
          .toArray();

        return res[0] ? res[0].availability : null;
      },

      allAvailability: async (
        _root, { input }: { input: AllAvailabilityInput }) => {
        const filter = {
          id: { $in: input.scheduleIds },
          'availability.startDate': {
            $gte: input.startDate ? input.startDate : new Date()
          }
        };
        if (!_.isNil(input.endDate)) {
          filter['availability.endDate']['$lte'] = new Date(input.endDate);
        }

        const res = await schedules
          .aggregate(getAggregatedAvailableSlotsPipeline(filter, true))
          .toArray();

        return res[0] ? res[0].availability : [];
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

        const updateOp = {};
        // idea for now: in the front end, if the slot is updated
        // (moved, time diff), delete the original and add the updated ones

        // add slots
        if (!_.isNil(input.add)) {
          const availability = _.map(input.add, (slot) => {
            const newSlot: SlotDoc = {
              id: uuid(),
              startDate: new Date(slot.startDate),
              endDate: new Date(slot.endDate)
            };

            return newSlot;
          });
          updateOp['$addToSet'] = { availability: availability };
        }

        // delete slots
        if (!_.isNil(input.delete)) {
          updateOp['$pull'] = { 'availability.id': { $in: input.delete } };
        }

        return await schedules
          .updateOne(context, filter, updateOp, { upsert: true });
      },

      deleteSchedule: async (_root, { id }, context: Context) =>
        await schedules.deleteOne(context, { id })
    }
  };
}

const scheduleCliche: ClicheServer = new ClicheServerBuilder('schedule')
  .initDb((db: ClicheDb, _config: Config): Promise<any> => {
    const schedules: Collection<ScheduleDoc> = db.collection('schedules');

    return schedules.createIndex({ id: 1, 'availability.id': 1 },
      { unique: true, sparse: true });
  })
  .actionRequestTable(actionRequestTable)
  .resolvers(resolvers)
  .build();

scheduleCliche.start();

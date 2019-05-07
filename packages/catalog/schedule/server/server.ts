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

import { getHours, getMinutes } from 'date-fns';
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

function intersection(setA, setB) {
  const _intersection = new Set();
  for (const elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem);
    }
  }

  return _intersection;
}

function combineFilterConditions(condition) {
  if (condition['$gte'] && condition['$lte']) {
    return {
      $and: [
        { $gte: condition['$gte'] },
        { $lte: condition['$lte'] }
      ]
    };
  }

  return condition;
}

// Reference: https://bit.ly/2ZTmOWu
async function getOverlappingAvailabilities(
  schedules: Collection<ScheduleDoc>,
  input: NextAvailabilityInput | AllAvailabilityInput,
  pipeline: any[],
  next = false) {

  const res = await schedules.aggregate(pipeline)
    .toArray();

  let points = [];
  res.forEach((schedule, i) => {
    schedule.availability.forEach((slot) => {
      points.push({ time: slot.startDate, isStart: true, sId: i });
      points.push({ time: slot.endDate, isStart: false, sId: i });
    });
  });

  points = _.sortBy(points, (p) => p.time);

  const activeSpans = {};
  const intersections = [];

  points.forEach((point) => {
    const lastIndex = intersections.length - 1;
    if (intersections.length !== 0 &&
      intersections[lastIndex]['time'] === point.time) {
      intersections[lastIndex]['sIds'].add(point.sId.toString());
    } else {
      const sIds = new Set(_.keys(activeSpans));
      sIds.add(point.sId.toString());
      intersections.push({ time: point.time, sIds: sIds });
    }

    if (!point.isStart) {
      activeSpans[point.sId] -= 1;
      if (activeSpans[point.sId] === 0) { delete activeSpans[point.sId]; }
    } else {
      if (point.sId in activeSpans) {
        activeSpans[point.sId] += 1;
      } else {
        activeSpans[point.sId] = 1;
      }
    }
  });

  const result = [];
  for (let i = 1; i < intersections.length; i++) {
    const start = intersections[i - 1];
    const end = intersections[i];
    const overlaps = intersection(start.sIds, end.sIds);
    if (overlaps.size >= input.scheduleIds.length) {
      result.push({
        id: uuid(),
        startDate: start.time,
        endDate: end.time
      });

      if (next) { return result; }
    }
  }

  return result;
}

function filterByStartTime(slots: SlotDoc[], startTime: string): SlotDoc[] {
  if (!_.isEmpty(startTime)) {
    const [startHh, startMm] = startTime.split(':');
    slots = _.filter(slots, (slot) => {
      if (getHours(slot.startDate) < parseInt(startHh, 10)) {
        return false;
      }
      if ((getHours(slot.startDate) === parseInt(startHh, 10)) &&
        (getMinutes(slot.startDate) < parseInt(startMm, 10))) {
        return false;
      }

      return true;
    });
  }

  return slots;
}

function filterByEndTime(slots: SlotDoc[], endTime: string): SlotDoc[] {
  if (!_.isEmpty(endTime)) {
    const [endHh, endMm] = endTime.split(':');
    slots = _.filter(slots, (slot) => {
      if (getHours(slot.endDate) > parseInt(endHh, 10)) {
        return false;
      }
      if ((getHours(slot.endDate) === parseInt(endHh, 10)) &&
        (getMinutes(slot.endDate) > parseInt(endMm, 10))) {
        return false;
      }

      return true;
    });
  }

  return slots;
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
        if (!_.isEmpty(input.startDate)) {
          condition['$gte'] = ['$$slot.startDate', new Date(input.startDate)];
        }
        if (!_.isEmpty(input.endDate)) {
          condition['$lte'] = ['$$slot.endDate', new Date(input.endDate)];
        }

        const res = await schedules
          .aggregate(
            getSlotsPipeline(filter,
              combineFilterConditions(condition),
              input.sortByStartDate,
              input.sortByEndDate))
          .next();

        let filteredByTime = res ? res.availability : [];
        filteredByTime = filterByStartTime(filteredByTime, input.startTime);
        filteredByTime = filterByEndTime(filteredByTime, input.endTime);

        return filteredByTime;
      },

      nextAvailability: async (
        _root, { input }: { input: NextAvailabilityInput }) => {
        const matchQuery = { id: { $in: input.scheduleIds } };
        const filterCondition = { $gte: ['$$slot.startDate', new Date()] };

        const pipeline = getSlotsPipeline(matchQuery, filterCondition, 1, 1);

        const overlaps = await getOverlappingAvailabilities(
          schedules, input, pipeline, true);

        return !_.isEmpty(overlaps) ? overlaps : undefined;
      },

      allAvailability: async (
        _root, { input }: { input: AllAvailabilityInput }) => {
        const matchQuery = { id: { $in: input.scheduleIds } };
        const condition = {
          $gte: [
            '$$slot.startDate',
            input.startDate ? new Date(input.startDate) : new Date()
          ]
        };

        if (!_.isEmpty(input.endDate)) {
          condition['$lte'] = ['$$slot.endDate', new Date(input.endDate)];
        }

        const pipeline = getSlotsPipeline(matchQuery,
          combineFilterConditions(condition),
          input.sortByStartDate,
          input.sortByEndDate);

        return await getOverlappingAvailabilities(schedules, input, pipeline);
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
        if (!_.isEmpty(input.slots)) {
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

        // Reason for two separate updates: https://bit.ly/2IJIVZR
        // add slots
        if (!_.isEmpty(input.add)) {
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
        if (!_.isEmpty(input.delete)) {
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

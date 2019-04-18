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
  ScheduleDoc,
  CreateScheduleInput,
  UpdateScheduleInput
} from './schema';

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
  'show-schedule': (extraInfo) => `
    query ShowSchedule($id: ID!) {
      schedule(id: $id) ${getReturnFields(extraInfo)}
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

function resolvers(db: ClicheDb, _config: Config): object {
  const schedules: Collection<ScheduleDoc> = db.collection('schedules');

  return {
    Query: {
      schedule: async (_root, { id }) =>
        await schedules.findOne({ id })
    },

    Schedule: {
      id: (schedule: ScheduleDoc) => schedule.id,
      content: (schedule: ScheduleDoc) => schedule.content
    },

    Mutation: {
      createSchedule: async (
        _root, { input }: { input: CreateScheduleInput }, context: Context) => {
        const schedule: ScheduleDoc = {
          id: input.id ? input.id : uuid(),
          content: input.content
        };

        return await schedules.insertOne(context, schedule);
      },

      updateSchedule: async (
        _root, { input }: { input: UpdateScheduleInput }, context: Context) => {
        const updateOp = { $set: { content: input.content } };

        return await schedules.updateOne(context, { id: input.id }, updateOp);
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

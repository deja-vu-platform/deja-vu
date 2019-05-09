import * as moment from 'moment';

import * as _ from 'lodash';


export interface Message {
  id: string;
  content: string;
  timestamp: moment.Moment;
  authorId: string;
  chatId: string;
}

export interface GraphQlMessage {
  id: string;
  content: string;
  timestamp: number;
  authorId: string;
  chatId: string;
}

export function toMessage(graphQlMessage: GraphQlMessage): Message {
  return Object.assign({}, graphQlMessage, {
    timestamp: fromUnixTime(graphQlMessage.timestamp)
  });
}

export function fromUnixTime(unixTime: string | number): moment.Moment {
  return moment.unix(Number(unixTime));
}

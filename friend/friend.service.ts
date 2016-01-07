import {Injectable} from 'angular2/core';

@Injectable()
export class FriendService {

  getFriends() {
    return Promise.resolve([{'id': 'Foo'}, {'id': 'Bar'}]);
  }
}

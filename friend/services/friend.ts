import {Injectable} from 'angular2/core';

@Injectable()
export class FriendService {

  getFriends() {
    return Promise.resolve([
        {'id': 'Foo', 'can_read': [], 'authors': [], 'friends': []},
        {'id': 'Foo', 'can_read': [], 'authors': [], 'friends': []}
        ]);
  }

  getUsers() {
    return Promise.resolve([
        {'id': 'Foo', 'can_read': [], 'authors': [], 'friends': []},
        {'id': 'Foo', 'can_read': [], 'authors': [], 'friends': []}
        ]);
  }
}

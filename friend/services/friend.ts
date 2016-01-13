import {Injectable} from 'angular2/core';
import {User} from '../user';

@Injectable()
export class FriendService {

  getFriends() {
    return Promise.resolve([
        {'username': 'foo', 'can_read': [], 'authors': [], 'friends': []},
        {'username': 'bar', 'can_read': [], 'authors': [], 'friends': []}
        ]);
  }

  addFriend(u1: User, u2: User) {
    return {};
  }

  unfriend(u1: User, u2: User) {
    return {};
  }

  getUsers() {
    return Promise.resolve([
        {'username': 'foo', 'can_read': [], 'authors': [], 'friends': []},
        {'username': 'bar', 'can_read': [], 'authors': [], 'friends': []}
        ]);
  }
}

import {Follower, Publisher} from "./data";

export function doesFollow(follower: Follower, publisher: Publisher): boolean {
  return !!follower.follows.filter(followed => {
    return followed.atom_id === publisher.atom_id;
  }).length;
}

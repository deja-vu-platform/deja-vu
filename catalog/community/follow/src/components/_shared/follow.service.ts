import {Injectable} from "@angular/core";

import {GraphQlService} from "gql";

import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";

import {Follower, Publisher, Message} from "./data";
import {getOrDefault} from "./utils";


@Injectable()
export default class FollowService {
  constructor(private _graphQlService: GraphQlService) {}

  // creates a follower, result is its atom_id
  createFollower(): Promise<string> {
    return this._graphQlService
      .post(`
        createFollower
      `)
      .map(data => getOrDefault(data, ["createFollower"], ""))
      .toPromise();
  }

  // creates a publisher, result is its atom_id
  createPublisher(): Promise<string> {
    return this._graphQlService
      .post(`
        createPublisher
      `)
      .map(data => getOrDefault(data, ["createPublisher"], ""))
      .toPromise();
  }

  // creates a message, result is its atom_id
  createMessage(): Promise<string> {
    return this._graphQlService
      .post(`
        createMessage
      `)
      .map(data => getOrDefault(data, ["createMessage"], ""))
      .toPromise();
  }

  // gets all followers in the database
  getFollowers(): Promise<Follower[]> {
    return this._graphQlService
      .get(`
        follower_all {
          atom_id,
          name,
          follows {
            atom_id
          }
        }
      `)
      .map(data => getOrDefault(data, ["follower_all"], []))
      .toPromise();
  }

  // gets all publishers in the database
  getPublishers(): Promise<Publisher[]> {
    return this._graphQlService
      .get(`
        publisher_all {
          atom_id,
          name
        }
      `)
      .map(data => getOrDefault(data, ["publisher_all"], []))
      .toPromise();
  }

  // gets all messages in the database
  getMessages(): Promise<Message[]> {
    return this._graphQlService
      .get(`
        message_all {
          atom_id,
          content,
          author {
            atom_id
          }
        }
      `)
      .map(data => getOrDefault(data, ["message_all"], []))
      .toPromise();
  }

  // gets the name of a follower
  getNameOfFollower(follower_id: string): Promise<string> {
    return this._graphQlService
      .get(`
        follower_by_id(
          atom_id: "${follower_id}"
        ) {
          name
        }
      `)
      .map(data => getOrDefault(data, ["follower_by_id", "name"], ""))
      .toPromise();
  }

  // gets the name of a publisher
  getNameOfPublisher(publisher_id: string): Promise<string> {
    return this._graphQlService
      .get(`
        publisher_by_id(
          atom_id: "${publisher_id}"
        ) {
          name
        }
      `)
      .map(data => getOrDefault(data, ["publisher_by_id", "name"], ""))
      .toPromise();
  }

  // gets the content of a message
  getContentOfMessage(message_id: string): Promise<string> {
    return this._graphQlService
      .get(`
        message_by_id(
          atom_id: "${message_id}"
        ) {
          name
        }
      `)
      .map(data => getOrDefault(data, ["message_by_id", "name"], ""))
      .toPromise();
  }

  // gets the author (publisher with only atom_id defined) of a message
  getAuthorOfMessage(message_id: string): Promise<Publisher> {
    return this._graphQlService
      .get(`
        message_by_id(
          atom_id: "${message_id}"
        ) {
          author {
            atom_id,
            name
          }
        }
      `)
      .map(data => getOrDefault(data, ["message_by_id", "author"], null))
      .toPromise();
  }

  // gets all publishers which are followed by a follower
  getPublishersByFollower(follower_id: string): Promise<Publisher[]> {
    return this._graphQlService
      .get(`
        follower_by_id(
          atom_id: "${follower_id}"
        ) {
          follows {
            atom_id
          }
        }
      `)
      .map(data => getOrDefault(data, ["follower_by_id", "follows"], []))
      .toPromise();
  }

  // gets all messages by publishers followed by a follower
  getMessagesByFollower(follower_id: string): Promise<Message[]> {
    return this._graphQlService
      .get(`
        messagesByFollower(
          follower_id: "${follower_id}"
        ) {
          atom_id,
          content,
          author {
            atom_id
          }
        }
      `)
      .map(data => getOrDefault(data, ["messagesByFollower"], []))
      .toPromise();
  }

  // gets followers who follow a publisher
  getFollowersByPublisher(publisher_id: string): Promise<Follower[]> {
    return this._graphQlService
      .get(`
        followersByPublisher(
          publisher_id: "${publisher_id}"
        ) {
          atom_id,
          name,
          follows {
            atom_id
          }
        }
      `)
      .map(data => getOrDefault(data, ["followersByPublisher"], []))
      .toPromise();
  }

  // gets all messages authored by a publisher
  getMessagesByPublisher(publisher_id: string): Promise<Message[]> {
    return this._graphQlService
      .get(`
        messagesByPublisher(
          publisher_id: "${publisher_id}"
        ) {
          atom_id,
          content,
          author {
            atom_id
          }
        }
      `)
      .map(data => getOrDefault(data, ["messagesByPublisher"], []))
      .toPromise();
  }

  // updates the name of a follower
  updateNameOfFollower(follower_id: string, name: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        renameFollower(
          follower_id: "${follower_id}",
          name: "${name}"
        )
      `)
      .map(data => getOrDefault(data, ["renameFollower"], false))
      .toPromise();
  }

  // updates the name of a publisher
  updateNameOfPublisher(publisher_id: string, name: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        renamePublisher(
          publisher_id: "${publisher_id}",
          name: "${name}"
        )
      `)
      .map(data => getOrDefault(data, ["renamePublisher"], false))
      .toPromise();
  }

  // updates the name of a message
  updateContentOfMessage(
    message_id: string,
    content: string
  ): Promise<boolean> {
    return this._graphQlService
      .post(`
        editContentOfMessage(
          message_id: "${message_id}",
          content: "${content}"
        )
      `)
      .map(data => getOrDefault(data, ["editContentOfMessage"], false))
      .toPromise();
  }

  // create a follow relationship
  addFollow(follower_id: string, publisher_id: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        follow(
          follower_id: "${follower_id}",
          publisher_id: "${publisher_id}"
        )
      `)
      .map(data => getOrDefault(data, ["follow"], false))
      .toPromise();
  }

  // destroy a follow relationship
  removeFollow(follower_id: string, publisher_id: string): Promise<boolean> {
    return this._graphQlService
      .post(`
        unfollow(
          follower_id: "${follower_id}",
          publisher_id: "${publisher_id}"
        )
      `)
      .map(data => getOrDefault(data, ["follow"], false))
      .toPromise();
  }
}

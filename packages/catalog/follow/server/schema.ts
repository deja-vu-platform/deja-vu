export interface PublisherDoc {
  id: string;
  messages?: Message[];
  followerIds?: string[];
}

export interface Message {
  id: string;
  content: string;
}

export interface CreateMessageInput {
  id?: string;
  publisherId: string;
  content: string;
}

export interface FollowersInput {
  ofPublisherId?: string;
}

export interface PublishersInput {
  followedById?: string;
}

export interface MessagesInput {
  ofPublishersFollowedById?: string;
  byPublisherId?: string;
}

export interface EditMessageInput {
  id: string;
  publisherId: string;
  content: string;
}

export interface FollowUnfollowInput {
  followerId: string;
  publisherId: string;
}

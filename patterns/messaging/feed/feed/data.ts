export type Name = string;
export type Content = string;

export interface Subscriber {
  name: Name;
  subcriptions: Name[];
}

export interface Publisher {
  name: Name;
  published: Content[];
}

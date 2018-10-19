export interface UserDoc {
  id: string;
  username: string;
  password: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'register' | 'change-password';
}

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface RegisterInput {
  id: string | undefined;
  username: string;
  password: string;
}

export interface SignInInput {
  username: string;
  password: string;
}

export interface ChangePasswordInput {
  id: string;
  oldPassword: string;
  newPassword: string;
}

export interface SignInOutput {
  token: string;
  user: User;
}

export interface VerifyInput {
  id: string;
  token: string;
}

export interface PasskeyDoc {
  code: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-passkey';
}

export interface VerifyInput {
  code: string;
  token: string;
}

export interface SignInOutput {
  token: string;
  passkey: PasskeyDoc;
}

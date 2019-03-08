export interface PasskeyDoc {
  id: string;
  code: string;
  pending?: PendingDoc;
}

export interface PendingDoc {
  reqId: string;
  type: 'create-passkey';
}

export interface CreatePasskeyInput {
  id?: string;
  code?: string;
}

export interface VerifyInput {
  code: string;
  token: string;
}

export interface SignInOutput {
  token: string;
  passkey: PasskeyDoc;
}

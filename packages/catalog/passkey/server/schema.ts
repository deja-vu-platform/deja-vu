export interface PasskeyDoc {
  id: string;
  code: string;
  used?: boolean;
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

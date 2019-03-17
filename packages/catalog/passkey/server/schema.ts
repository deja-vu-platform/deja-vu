export interface PasskeyDoc {
  code: string;
  used?: boolean;
}

export interface VerifyInput {
  code: string;
  token: string;
}

export interface SignInOutput {
  token: string;
  passkey: PasskeyDoc;
}

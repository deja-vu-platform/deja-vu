export interface Passkey {
  code: string;
}

export interface SignInOutput {
  token: string;
  passkey: Passkey;
}

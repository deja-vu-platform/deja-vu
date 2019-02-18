import { Injectable } from '@angular/core';

import { Passkey } from './passkey.model';


const TOKEN_KEY = 'token';
const PASSKEY_KEY = 'passkey';
const GUEST_TOKEN_KEY = 'guest-token';
const GUEST_PASSKEY_KEY = 'guest-passkey';

@Injectable()
export class PasskeyService {
  setSignedInPasskey(token: string, passkey: Passkey,
    isGuest: boolean = false) {
    localStorage.setItem(this.getTokenType(isGuest), token);
    localStorage.setItem(this.getPasskeyType(isGuest), JSON.stringify(passkey));
  }

  getSignedInPasskey(isGuest: boolean = true): Passkey {
    return JSON.parse(localStorage.getItem(this.getPasskeyType(isGuest)));
  }

  getToken(isGuest: boolean = true): string {
    return localStorage.getItem(this.getTokenType(isGuest));
  }

  signOut(isGuest: boolean = true) {
    localStorage.removeItem(this.getTokenType(isGuest));
    localStorage.removeItem(this.getPasskeyType(isGuest));
  }

  private getTokenType(isGuest: boolean): string {
    return isGuest ? GUEST_TOKEN_KEY : TOKEN_KEY;
  }

  private getPasskeyType(isGuest: boolean): string {
    return isGuest ? GUEST_PASSKEY_KEY : PASSKEY_KEY;
  }
}

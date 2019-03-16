import { Injectable } from '@angular/core';

import { Passkey } from './passkey.model';


const TOKEN_KEY = 'token';
const PASSKEY_KEY = 'passkey';

@Injectable()
export class PasskeyService {
  setSignedInPasskey(token: string, passkey: Passkey,
    isGuest: boolean = false) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PASSKEY_KEY, JSON.stringify(passkey));
  }

  getSignedInPasskey(): Passkey {
    return JSON.parse(localStorage.getItem(PASSKEY_KEY));
  }

  getToken(): string {
    return localStorage.getItem(TOKEN_KEY);
  }

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PASSKEY_KEY);
  }
}

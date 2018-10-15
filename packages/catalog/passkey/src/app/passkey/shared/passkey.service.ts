import { Injectable } from '@angular/core';

import { Passkey } from './passkey.model';


const TOKEN_KEY = 'token';
const PASSKEY_KEY = 'passkey';
const GUEST_PASSKEY_KEY = 'guest';
const GUEST_TOKEN_KEY = 'guest-token';

@Injectable()
export class PasskeyService {
  setSignedInPasskey(token: string, passkey: Passkey) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PASSKEY_KEY, JSON.stringify(passkey));
  }

  setSignedInGuest(token: string, passkey: Passkey) {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
    localStorage.setItem(GUEST_PASSKEY_KEY, JSON.stringify(passkey));
  }

  getSignedInPasskey(): Passkey {
    return JSON.parse(localStorage.getItem(PASSKEY_KEY));
  }

  getSignedInGuest(): Passkey {
    return JSON.parse(localStorage.getItem(GUEST_PASSKEY_KEY));
  }

  getToken(): string {
    return localStorage.getItem(TOKEN_KEY);
  }

  getGuestToken(): string {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  }

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PASSKEY_KEY);
  }

  guestSignOut() {
    localStorage.removeItem(GUEST_TOKEN_KEY);
    localStorage.removeItem(GUEST_PASSKEY_KEY);
  }
}

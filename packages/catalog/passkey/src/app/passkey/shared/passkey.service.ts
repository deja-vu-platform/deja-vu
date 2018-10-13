import { Injectable } from '@angular/core';

import { Passkey } from './passkey.model';


const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const GUEST_USER_KEY = 'guest';
const GUEST_TOKEN_KEY = 'guest-token';

@Injectable()
export class PasskeyService {
  setSignedInUser(token: string, passkey: Passkey) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(passkey));
  }

  setSignedInGuest(token: string, passkey: Passkey) {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
    localStorage.setItem(GUEST_USER_KEY, JSON.stringify(passkey));
  }

  getSignedInUser(): Passkey {
    return JSON.parse(localStorage.getItem(USER_KEY));
  }

  getSignedInGuest(): Passkey {
    return JSON.parse(localStorage.getItem(GUEST_USER_KEY));
  }

  getToken(): string {
    return localStorage.getItem(TOKEN_KEY);
  }

  getGuestToken(): string {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  }

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  guestSignOut() {
    localStorage.removeItem(GUEST_TOKEN_KEY);
    localStorage.removeItem(GUEST_USER_KEY);
  }
}

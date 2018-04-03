import { Injectable  } from '@angular/core';

import { User } from './authentication.model';


const TOKEN_KEY = 'token';
const USER_KEY = 'user';

@Injectable()
export class AuthenticationService {
  setSignedInUser(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getSignedInUser(): User {
    return JSON.parse(localStorage.getItem(USER_KEY));
  }

  getToken(): string {
    return localStorage.getItem(TOKEN_KEY);
  }

  signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

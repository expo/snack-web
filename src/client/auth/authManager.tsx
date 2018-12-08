import cookieParser from 'cookie';
import ExtendableError from 'es6-error';
import jwtDecode from 'jwt-decode';
import * as Constants from './constants';
import { messages } from './validations';
import Storage from './storage';
import Segment from '../utils/Segment';

type Auth0UserData = {
  name: string;
  username: string;
  id: string;
  given_name: string;
  family_name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: string;
  nonce: string;
  iss: string;
  sub: string;
  aud: string;
  exp: string;
  iat: string;
  ['https://expo.io/isOnboarded']: boolean;
};

type Auth0TokenData = {
  access_token: string;
  expires_in: number;
  expires_at: number;
  scope: string;
  state: string;
  id_token: string;
  token_type: 'Bearer';
  sessionSecret: string;
};

export default class AuthenticationManager {
  static _currentInstance: AuthenticationManager | null = null;

  _cookieStorage: Storage;
  _localStorage: Storage | undefined;
  _headers: { cookie?: string } | undefined;

  static initialize() {
    AuthenticationManager._currentInstance = new AuthenticationManager();
  }

  static get(): AuthenticationManager {
    if (!AuthenticationManager._currentInstance) {
      AuthenticationManager._currentInstance = new AuthenticationManager();
    }
    return AuthenticationManager._currentInstance;
  }

  constructor() {
    this._cookieStorage = new Storage('io.expo.auth', 'cookie');

    // @ts-ignore
    if (process.browser) {
      // we can make local storage avaailable in the browser
      this._localStorage = new Storage('io.expo.auth', 'localstorage');
    }
  }

  setCurrentHeaders(headers: { cookie?: string }) {
    this._headers = headers;
  }

  async loginWithUsernamePassword(username: string, password: string) {
    if (!username) {
      throw new GenericError(messages.USERNAME_NO_EXIST);
    } else if (!password) {
      throw new GenericError(messages.PASSWORD_NO_EXIST);
    }

    const result: { data?: Auth0TokenData } =
      (await _performResourceOwnerGrant(username, password)) || {};
    const tokenData = result.data;

    if (!tokenData) {
      return;
    }
    if (tokenData.id_token) {
      // The original access token given by auth0's endpoint works, but www's access token doesnt
      tokenData.access_token = tokenData.id_token;
    }
    if (tokenData.sessionSecret) {
      this._saveSessionData(tokenData.sessionSecret);
    } else {
      this._saveTokenAndUserData(tokenData);
    }
    const profile = await _getUserProfile();

    if (profile) {
      Segment.getInstance().identify({ username: profile.username });
    }

    return profile;
  }

  async getProfile() {
    const profile = await _getUserProfile();
    return profile;
  }

  async logout(redirectUrl?: string) {
    this._clearTokenAndUserData();
    this._clearSessionSecretData();
    this._localStorage && this._localStorage.removeItem('nonce');
    this._localStorage && this._localStorage.removeItem('state');

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  get currentSessionSecret(): string | null {
    const sessionSecret = this._getSessionData();
    if (sessionSecret) {
      if (this._isSessionSecretValid(sessionSecret.expires_at)) {
        return JSON.stringify(sessionSecret);
      }
      this._clearSessionSecretData();
      return null;
    }
    return null;
  }

  _isSessionSecretValid(expires_at: number): boolean {
    return Date.now() < expires_at;
  }

  get currentToken(): string | null {
    const tokenAndUserData = this._getTokenAndUserData();
    if (tokenAndUserData) {
      if (this._isTokenValid(tokenAndUserData.tokenData)) {
        return tokenAndUserData.tokenData.access_token;
      }
      this._clearTokenAndUserData();
      return null;
    }
    return null;
  }

  get currentIdToken(): string | null {
    const tokenAndUserData = this._getTokenAndUserData();
    if (tokenAndUserData) {
      if (this._isTokenValid(tokenAndUserData.tokenData)) {
        return tokenAndUserData.tokenData.id_token;
      }
      this._clearTokenAndUserData();
      return null;
    }
    return null;
  }

  _isTokenValid(tokenData: Auth0TokenData): boolean {
    return Date.now() < tokenData.expires_at;
  }

  _getSessionData() {
    let rawSessionData;
    if (this._headers) {
      rawSessionData = this._parseUserSessionFromRequestHeaders(this._headers || {});
    } else {
      // Get from storage
      rawSessionData = this._cookieStorage.getItem('sessionSecret');
    }
    if (rawSessionData) {
      try {
        return JSON.parse(rawSessionData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  _getTokenAndUserData():
    | {
        tokenData: Auth0TokenData;
        userData: Auth0UserData;
      }
    | undefined
    | null {
    let rawTokenData;
    let rawUserData;
    if (this._headers) {
      const { tokenData, userData } = this._parseTokenFromRequestHeaders(this._headers) || {
        tokenData: undefined,
        userData: undefined,
      };
      rawTokenData = tokenData;
      rawUserData = userData;
    } else {
      // Get from storage
      rawTokenData = this._cookieStorage.getItem('tokenData');
      rawUserData = this._cookieStorage.getItem('userData');
    }
    if (rawTokenData && rawUserData) {
      try {
        return {
          tokenData: JSON.parse(rawTokenData),
          userData: JSON.parse(rawUserData),
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  _saveSessionData(sessionSecret: string): void {
    this._clearSessionSecretData();
    const { expires_at } = JSON.parse(sessionSecret);
    this._cookieStorage.setItem('sessionSecret', sessionSecret, {
      expires: new Date(expires_at),
    });
  }

  _saveTokenAndUserData(tokenData: Auth0TokenData): void {
    this._clearTokenAndUserData();
    const expiresAt = tokenData.expires_in * 1000 + Date.now();
    tokenData.expires_at = expiresAt;
    this._cookieStorage.setItem('tokenData', JSON.stringify(tokenData), {
      expires: new Date(tokenData.expires_at),
    });
    this._cookieStorage.setItem('userData', JSON.stringify(jwtDecode(tokenData.id_token)), {
      expires: new Date(tokenData.expires_at),
    });
  }

  _clearSessionSecretData() {
    this._cookieStorage.removeItem('sessionSecret');
  }

  _clearTokenAndUserData() {
    this._cookieStorage.removeItem('tokenData');
    this._cookieStorage.removeItem('userData');
  }

  _parseUserSessionFromRequestHeaders(headers: { cookie?: string }): string | null {
    const { cookie } = headers;
    let parsedCookie;
    try {
      parsedCookie = cookieParser.parse(cookie || '');
    } catch (e) {
      return null;
    }

    const sessionSecretKey = 'io.expo.auth.sessionSecret';

    return parsedCookie[sessionSecretKey] ? parsedCookie[sessionSecretKey] : null;
  }

  _parseTokenFromRequestHeaders(headers: {
    cookie?: string;
  }): {
    userData: string;
    tokenData: string;
  } | null {
    const { cookie } = headers;
    let parsedCookie;
    try {
      parsedCookie = cookieParser.parse(cookie || '');
    } catch (e) {
      return null;
    }

    const tokenDataKey = 'io.expo.auth.tokenData';
    const userDataKey = 'io.expo.auth.userData';

    if (parsedCookie[tokenDataKey]) {
      try {
        const tokenData = parsedCookie[tokenDataKey];
        const userData = parsedCookie[userDataKey];
        return {
          tokenData,
          userData,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Performs resource-owner password grant with Auth0  or returns session tokens from www.
 *
 * On success, a set of token data (as defined by the Auth0TokenData Flow type)
 * will be returned.
 *
 * On error, a generic error will be thrown.
 */
const _performResourceOwnerGrant = _handleApiErrors(async (username: string, password: string) => {
  return await _performApiRequest('loginAsync', {
    username,
    password,
  });
});

const _getUserProfile = _handleApiErrors(async () => {
  const authManager = AuthenticationManager.get();

  // if auth0 token set and session secret is missing, return null
  if (!authManager.currentToken && !authManager.currentSessionSecret) {
    return null;
  }
  const result: { data?: Auth0UserData } = await _performApiRequest(`userInfo`, null, {
    method: 'GET',
    headers: {
      ...(authManager.currentSessionSecret
        ? { 'Expo-Session': authManager.currentSessionSecret }
        : {}),
      ...(authManager.currentIdToken
        ? { Authorization: `Bearer ${authManager.currentIdToken}` }
        : {}),
    },
  });
  return result.data;
});

// tslint:disable-next-line
function _handleApiErrors<F extends Function>(fn: F): F {
  // @ts-ignore
  return async (...args) => {
    try {
      const response: any = await fn(...args);
      if (!response) {
        throw new GenericError(messages.DEFAULT_OUR_FAULT);
      }
      if (!!response.errors && response.errors.length) {
        const error = response.errors[0];
        const errorMessage = error.details ? error.details.message : error.message;
        throw new ApiError(errorMessage);
      }
      return response;
    } catch (e) {
      if (e instanceof ApiError || e instanceof GenericError) {
        throw e;
      }
      throw new GenericError(messages.DEFAULT_OUR_FAULT);
    }
  };
}

/**
 * Generic helper method to perform an request to the Expo API
 */
async function _performApiRequest<T>(
  route: string,
  body: object | null,
  options?: { method: 'GET' | 'POST'; headers?: { [key: string]: string } }
): Promise<T> {
  const customHeaders = (options && options.headers) || {};
  if (options) {
    delete options.headers;
  }
  const response = await fetch(`${Constants.CONFIG.koaServerPath}/${route}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    body:
      body &&
      JSON.stringify({
        ...body,
      }),
    ...(options || {}),
  });
  return response.json();
}

class GenericError extends ExtendableError {}
class ApiError extends ExtendableError {}

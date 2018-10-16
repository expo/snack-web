/**
 * @flow
 */

import cookieParser from 'cookie';
import ExtendableError from 'es6-error';
import jwtDecode from 'jwt-decode';
import querystring from 'query-string';

import * as Constants from './constants';
import * as Validations from './validations';
import Storage from './storage';
import Segment from '../utils/Segment';

type SignupFormData = {
  password: string,
  username: string,
  email: string,
};

type Auth0UserData = {
  ['https://expo.io/isOnboarded']: boolean,
  name: string,
  id: string,
  given_name: string,
  family_name: string,
  nickname: string,
  picture: string,
  updated_at: string,
  email: string,
  email_verified: string,
  nonce: string,
  iss: string,
  sub: string,
  aud: string,
  exp: string,
  iat: string,
};

type Auth0TokenData = {
  access_token: string,
  expires_in: number,
  expires_at: number,
  scope: string,
  state: string,
  id_token: string,
  token_type: 'Bearer',
};

type MergeData = {
  email_verified: boolean,
  linked_account_id: string,
  linked_account_connection: string,
  bio?: string,
  nickname?: string,
  firstName?: string,
  lastName?: string,
  location?: string,
  blog?: string,
};

const AUTH_SCOPE = 'openid profile email id username nickname';

export default class AuthenticationManager {
  static _currentInstance: ?AuthenticationManager = null;
  _cookieStorage: Storage;
  _localStorage: Storage;
  _headers: Object;

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

    /* $FlowIgnore */
    if (process.browser) {
      // we can make local storage avaailable in the browser
      this._localStorage = new Storage('io.expo.auth', 'localstorage');
    }
  }

  setCurrentHeaders(headers: Object) {
    this._headers = headers;
  }

  async loginWithUsernamePassword(username: string, password: string) {
    if (!username) {
      throw new GenericError(Validations.messages.USERNAME_NO_EXIST);
    } else if (!password) {
      throw new GenericError(Validations.messages.PASSWORD_NO_EXIST);
    }

    const result = (await _performResourceOwnerGrant(username, password)) || {};
    const tokenData = result.data;

    if (!tokenData) {
      return;
    }
    if (tokenData.id_token) {
      // The original access token given by auth0's endpoint works, but www's access token doesnt
      result.data.access_token = result.data.id_token;
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
    this._localStorage.removeItem('nonce');
    this._localStorage.removeItem('state');

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }

  get currentSessionSecret(): ?string {
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

  get currentToken(): ?string {
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

  get currentIdToken(): ?string {
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
      rawSessionData = this._parseUserSessionFromRequestHeaders(this._headers);
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

  _getTokenAndUserData(): ?{
    tokenData: Auth0TokenData,
    userData: Auth0UserData,
  } {
    let rawTokenData, rawUserData;
    if (this._headers) {
      const { tokenData, userData } = this._parseTokenFromRequestHeaders(this._headers) || {};
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

  _parseUserSessionFromRequestHeaders(headers: Object): ?string {
    const { cookie } = headers;
    let parsedCookie;
    try {
      parsedCookie = cookieParser.parse(cookie);
    } catch (e) {
      return null;
    }

    const sessionSecretKey = 'io.expo.auth.sessionSecret';

    return parsedCookie[sessionSecretKey] ? parsedCookie[sessionSecretKey] : null;
  }

  _parseTokenFromRequestHeaders(headers: Object): ?{ userData: string, tokenData: string } {
    const { cookie } = headers;
    let parsedCookie;
    try {
      parsedCookie = cookieParser.parse(cookie);
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
const _performResourceOwnerGrant = _handleApiErrors(
  async (username: string, password: string): Promise<?Object> => {
    return await _performApiRequest('loginAsync', {
      username,
      password,
    });
  }
);

const _getUserProfile = _handleApiErrors(async (): Promise<?Object> => {
  const authManager = AuthenticationManager.get();

  // if auth0 token set and session secret is missing, return null
  if (!authManager.currentToken && !authManager.currentSessionSecret) {
    return null;
  }
  const result = await _performApiRequest(`userInfo`, null, {
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

const _performImplicitGrant = (nonce: string, state?: string = '') => {
  const query = querystring.stringify({
    client_id: Constants.AUTH.clientId,
    audience: Constants.AUTH.audience,
    scope: AUTH_SCOPE,
    connection: 'github',
    nonce,
    state,
    response_type: 'id_token token',
    redirect_uri: `${window.location.origin}/confirm-auth`,
  });

  window.location.href = `${Constants.AUTH.auth0Endpoint}/authorize?${query}`;
};

function _handleApiErrors<T: ?Object, F: (...args?: Array<any>) => Promise<T>>(fn: F): F {
  return ((async (...args) => {
    try {
      const response = await fn(...args);
      if (!response) {
        throw new GenericError(Validations.messages.DEFAULT_OUR_FAULT);
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
      throw new GenericError(Validations.messages.DEFAULT_OUR_FAULT);
    }
  }: any): F);
}

/**
 * Generic helper method to perform an request to the Expo API
 */
async function _performApiRequest<T>(route: string, body: ?Object, options?: Object): Promise<T> {
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

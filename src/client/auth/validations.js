/**
 * @flow
 */

import * as Strings from '../utils/strings';

const EMAIL_REGEX = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

// NOTE(jim): Cherry picked from here: https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

const MIN_PASSWORD_LENGTH = 3;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;

export const messages = {
  BIO_TOO_LONG: 'Your bio is too long.',
  USERNAME_SAVE_ERROR: 'We could not save this username, try another one.',
  USERNAME_TAKEN: 'This user already exists, please login instead.',
  USERNAME_NO_EXIST: 'Please provide us with a username.',
  USERNAME_TOO_SHORT: `Your username must be at least ${MIN_USERNAME_LENGTH} characters.`,
  USERNAME_NO_SPECIAL:
    'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.',
  USERNAME_TOO_LONG: `Your username must be under ${MAX_USERNAME_LENGTH} characters.`,
  PASSWORD_NO_EXIST: 'Please provide us with a password.',
  PASSWORD_TOO_SHORT: `Your password must be at least ${MIN_USERNAME_LENGTH} characters.`,
  EMAIL_SAVE_ERROR: 'We could not save this e-mail, try another one.',
  EMAIL_NO_EXIST: 'Please provide us with a email.',
  EMAIL_NO_VALID: 'Your email address must be valid.',
  PHONE_NO_EXIST: 'Please provide us with a phone number.',
  PHONE_NO_VALID: 'Your phone number must be valid.',
  NO_EMAIL_NO_PHONE: 'Your phone number or email must be valid.',
  CONFIRM_PASSWORD_MISSING: 'You need to confirm your password.',
  CONFIRM_PASSWORD_WRONG: 'Your password does not match.',
  CANT_FIND_VIEWER: 'There is something wrong on our end, please try again in a few seconds',
  DEFAULT_OUR_FAULT: 'Something on our end broke! We are so sorry about this. Try again later',
  CRITICAL_AUTH_ERROR:
    'We have broken something with our authentication setup, we will resolve this soon.',
  INVALID_USERNAME_PASSWORD: 'Wrong username or password.',
  MUST_BE_LOGGED_IN_FOR_SUGGESTED: 'Must be logged in to find suggested accounts.',
  USER_IS_BLOCKED:
    'Your user account is currently disabled. Please contact support@expo.io for assistance.',
  CANT_SEND_EMAIL_OR_TEXT: 'We were unable to send you an email or text, please try again.',
};

export const username = (username: string) => {
  if (Strings.isEmptyOrNull(username)) {
    return messages.USERNAME_NO_EXIST;
  }

  // NOTE(jim): No special characters.
  if (!/^([a-zA-Z0-9_-]+)$/i.test(username)) {
    return messages.USERNAME_NO_SPECIAL;
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return messages.USERNAME_TOO_SHORT;
  }

  if (username.length >= MAX_USERNAME_LENGTH) {
    return messages.USERNAME_TOO_LONG;
  }

  return null;
};

export const password = (password: string) => {
  if (Strings.isEmptyOrNull(password)) {
    return messages.PASSWORD_NO_EXIST;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return messages.PASSWORD_TOO_SHORT;
  }

  return null;
};

export const phonenumber = (phoneNumber: string) => {
  if (Strings.isEmptyOrNull(phoneNumber)) {
    return messages.PHONE_NO_EXIST;
  }

  if (!PHONE_REGEX.test(phoneNumber)) {
    return messages.PHONE_NO_VALID;
  }

  return null;
};

export const email = (email: string) => {
  if (Strings.isEmptyOrNull(email)) {
    return messages.EMAIL_NO_EXIST;
  }

  if (!EMAIL_REGEX.test(email)) {
    return messages.EMAIL_NO_VALID;
  }

  return null;
};

export const getSavedProps = (changed: Object, originalUser: Object, nextUser: Object) => {
  const nextUserKeys = Object.keys(nextUser);
  const savedProps = {};

  nextUserKeys.forEach(k => {
    if (changed[k] && originalUser[k] !== nextUser[k]) {
      savedProps[k] = true;
    }
  });

  return savedProps;
};

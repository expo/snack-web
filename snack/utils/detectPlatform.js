/**
 * @flow
 */

export function isAndroid() {
  if (typeof navigator !== 'undefined') {
    return /Android/i.test(navigator.userAgent);
  } else {
    return false;
  }
}

export function isIOS() {
  if (typeof navigator !== 'undefined') {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  } else {
    return false;
  }
}

export function isNotMobile() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return !isAndroid() && !isIOS();
}

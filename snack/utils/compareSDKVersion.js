/* @flow */

export default function compareSDKVersion(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  const partsA = a.split('.').map(n => parseInt(n, 10));
  const partsB = b.split('.').map(n => parseInt(n, 10));

  // Compare major
  if (partsA[0] > partsB[0]) {
    return 1;
  }

  // Compare minor
  if (partsA[0] === partsB[0] && partsA[1] > partsB[1]) {
    return 1;
  }

  // Compare patch
  if (partsA[0] === partsB[0] && partsA[1] === partsB[1] && partsA[2] > partsB[2]) {
    return 1;
  }

  return -1;
}

/* @flow */

import type { FileSystemEntry } from '../types';

export default function updateEntry<T: FileSystemEntry>(entry: T, updates: Object): T {
  /* $FlowFixMe */
  return {
    ...entry,
    item: updates.item ? { ...entry.item, ...updates.item } : entry.item,
    state: updates.state ? { ...entry.state, ...updates.state } : entry.state,
  };
}

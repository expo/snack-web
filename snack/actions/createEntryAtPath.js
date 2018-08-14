/* @flow */

import { getUniquePath, getParentPath } from '../utils/fileUtilities';
import updateEntry from './updateEntry';
import type { FileSystemEntry } from '../types';

export default function createEntryAtPath(
  entries: FileSystemEntry[],
  path: ?string,
  e: FileSystemEntry,
  suffix?: string
): FileSystemEntry {
  // Check if an entry exists for the path we want to create the entry at
  const entry = path ? entries.find(e => e.item.path === path) : null;

  // If the entry is a folder, we create the new entry inside
  // Otherwise we create it inside the parent
  const parent = entry
    ? entry.item.type === 'folder' ? entry.item.path : getParentPath(entry.item.path)
    : null;

  const name = e.item.path.split('/').pop();
  const item = updateEntry(e, {
    item: {
      path: getUniquePath(
        entries.map(e => e.item.path),
        parent ? `${parent}/${name}` : name,
        suffix
      ),
    },
  });

  /* $FlowFixMe */
  item.state = {};

  return item;
}

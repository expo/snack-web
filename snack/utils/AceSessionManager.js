/* @flow */

import ace from 'brace';

export default {
  _data: {},

  create(path: string, content: string, mode: string) {
    const session = ace.createEditSession(content, mode);

    const data = this._data[path];

    if (data) {
      session.$undoManager.$doc = session;
      session.$undoManager.$undoStack = data.history.undo;
      session.$undoManager.$redoStack = data.history.redo;
      session.selection.fromJSON(data.selection);
      session.setOptions(data.options);
      session.setScrollTop(data.scrollTop);
      session.setScrollLeft(data.scrollLeft);
    }

    return session;
  },

  save(path: string, session: any) {
    const filterHistory = deltas => deltas.filter(d => d.group !== 'fold');

    this._data[path] = {
      history: {
        undo: session.$undoManager.$undoStack.map(filterHistory),
        redo: session.$undoManager.$redoStack.map(filterHistory),
      },
      selection: session.selection.toJSON(),
      value: session.getValue(),
      scrollTop: session.getScrollTop(),
      scrollLeft: session.getScrollLeft(),
      options: session.getOptions(),
    };
  },

  remove(path: string) {
    this._data[path] = null;
  },

  rename(oldPath: string, newPath: string) {
    const data = this._data[oldPath];
    this._data[oldPath] = null;
    this._data[newPath] = data;
  },
};

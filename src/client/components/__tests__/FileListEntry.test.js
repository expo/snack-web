/* @flow */
import * as React from 'react';
import { StyleSheetTestUtils } from 'aphrodite';
// $FlowFixMe
import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';
import FileListEntry from '../FileList/FileListEntry';

beforeEach(StyleSheetTestUtils.suppressStyleInjection);
afterEach(StyleSheetTestUtils.clearBufferAndResumeStyleInjection);

const fn = () => {};
const fakeProps = {
  rest: [],
  clipboard: [],
  onOpen: fn,
  onFocus: fn,
  onSelect: fn,
  onDelete: fn,
  onCopy: fn,
  onRename: fn,
  onExpand: fn,
  onCreateFile: fn,
  onCreateFolder: fn,
  onPaste: fn,
  onClearClipboard: fn,
  getAdjacentEntries: () => [],
  theme: 'light',
};

it('renders children', () => {
  const wrapper = shallow(
    <FileListEntry
      entry={{ item: { path: 'app', type: 'folder' }, state: {} }}
      rest={[
        {
          item: { path: 'app/index.js', type: 'file', content: '' },
          state: {},
        },
      ]}
      {...fakeProps}
    />
  );

  expect(toJSON(wrapper)).toMatchSnapshot();
});

it('triggers rename if rendered with `isCreating`', () => {
  const onRename = jest.fn();
  const wrapper = shallow(
    <FileListEntry
      {...fakeProps}
      entry={{
        item: { path: 'test/app', type: 'file', content: '' },
        state: { isCreating: true },
      }}
      onRename={onRename}
    />
  );

  expect(wrapper.state().isRenaming).toBe(true);
  expect(wrapper.state().name).toBe('app');

  wrapper.setState({ name: 'foo.js' });
  wrapper.instance()._handleToggleRename();

  expect(onRename).toBeCalledWith('test/app', 'test/foo.js');
  expect(wrapper.state().isRenaming).toBe(false);
  expect(wrapper.state().name).toBe('');

  wrapper.setProps({
    entry: {
      item: {
        path: 'test/foo.js',
        type: 'file',
        content: '',
      },
      state: {},
    },
  });

  expect(wrapper.state().isRenaming).toBe(false);
  expect(wrapper.state().name).toBe('');
});

it('expands folder', () => {
  const onExpand = jest.fn();
  const wrapper = shallow(
    <FileListEntry
      {...fakeProps}
      entry={{ item: { path: 'app/test', type: 'folder' }, state: {} }}
      onExpand={onExpand}
    />
  );

  wrapper.instance()._handleToggleExpand();

  expect(onExpand).toBeCalledWith('app/test', true);

  wrapper.setProps({
    entry: {
      item: {
        path: 'app/test',
        type: 'folder',
      },
      state: {
        isExpanded: true,
      },
    },
  });

  wrapper.instance()._handleToggleExpand();

  expect(onExpand).toBeCalledWith('app/test', false);
});

it('deletes entry', () => {
  const onDelete = jest.fn();
  const wrapper = shallow(
    <FileListEntry
      {...fakeProps}
      entry={{
        item: { path: 'app/test', type: 'file', content: '' },
        state: {},
      }}
      onDelete={onDelete}
    />
  );

  wrapper.instance()._handleDelete();

  expect(onDelete).toBeCalledWith('app/test');
});

/*
 * it('opens entry', () => {
 *   const onOpen = jest.fn();
 *   const wrapper = shallow(
 *     <FileListEntry
 *       {...fakeProps}
 *       entry={{
 *         item: { path: 'app/test', type: 'file', content: '' },
 *         state: {},
 *       }}
 *       onOpen={onOpen}
 *     />
 *   );
 *
 *   wrapper.instance()._handleClick({ target: { tagName: 'INPUT' } });
 *
 *   expect(onOpen).not.toHaveBeenCalled();
 *
 *   wrapper.instance()._handleClick({ target: { tagName: 'BUTTON' } });
 *
 *   expect(onOpen).toHaveBeenCalled();
 * });*/

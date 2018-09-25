/* @flow */

import * as React from 'react';
import { StyleSheetTestUtils } from 'aphrodite';
// $FlowFixMe
import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';
import FileList from '../FileList/FileList';

jest.mock('../Preferences/withThemeName', () => c => c);

beforeEach(StyleSheetTestUtils.suppressStyleInjection);
afterEach(StyleSheetTestUtils.clearBufferAndResumeStyleInjection);

it('renders children', () => {
  const wrapper = shallow(
    <FileList
      entries={[
        { item: { path: 'App.js', type: 'file', content: '' }, state: {} },
        { item: { path: 'components', type: 'folder' }, state: {} },
      ]}
      onEntriesChange={jest.fn()}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      preventRedirectWarning={jest.fn()}
      hasSnackId={false}
      saveStatus="changed"
      sdkVersion="28.0.0"
      visible
    />
  );

  expect(toJSON(wrapper)).toMatchSnapshot();
});

it('closes entry', () => {
  const onEntriesChange = jest.fn();
  const wrapper = shallow(
    <FileList
      entries={[
        {
          item: { path: 'test', type: 'folder' },
          state: { isSelected: true, isExpanded: true },
        },
        {
          item: { path: 'test/App.js', type: 'file', content: '' },
          state: { isSelected: true, isOpen: true },
        },
        { item: { path: 'file.js', type: 'file', content: '' }, state: { isOpen: true } },
      ]}
      onEntriesChange={onEntriesChange}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      preventRedirectWarning={jest.fn()}
      hasSnackId={false}
      saveStatus="changed"
      sdkVersion="28.0.0"
      visible
    />
  );

  wrapper.instance()._handleEntryClose('test');

  expect(onEntriesChange.mock.calls[0]).toMatchSnapshot();

  wrapper.instance()._handleEntryClose('test/App.js');

  expect(onEntriesChange.mock.calls[1]).toMatchSnapshot();

  wrapper.instance()._handleEntryClose('file.js');

  expect(onEntriesChange.mock.calls[2]).toMatchSnapshot();

  wrapper.instance()._handleEntryCloseOthers('file.js');

  expect(onEntriesChange.mock.calls[3]).toMatchSnapshot();

  wrapper.instance()._handleEntryCloseAll();

  expect(onEntriesChange.mock.calls[4]).toMatchSnapshot();
});

it('updates entry', () => {
  // TODO
});

it('deletes entry', () => {
  const onEntriesChange = jest.fn();
  const wrapper = shallow(
    <FileList
      entries={[
        { item: { path: 'test', type: 'folder' }, state: {} },
        { item: { path: 'test/App.js', type: 'file', content: '' }, state: {} },
        { item: { path: 'components', type: 'folder' }, state: {} },
      ]}
      onEntriesChange={onEntriesChange}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      preventRedirectWarning={jest.fn()}
      hasSnackId={false}
      saveStatus="changed"
      sdkVersion="28.0.0"
      visible
    />
  );

  wrapper.instance()._handleEntryDelete('test');

  expect(onEntriesChange).toBeCalledWith([
    { item: { path: 'components', type: 'folder' }, state: {} },
  ]);
});

it('copies item to clipboard', () => {
  const wrapper = shallow(
    <FileList
      entries={[
        { item: { path: 'test/App.js', type: 'file', content: '' }, state: {} },
        { item: { path: 'test/components', type: 'folder' }, state: {} },
      ]}
      onEntriesChange={jest.fn()}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      preventRedirectWarning={jest.fn()}
      hasSnackId={false}
      saveStatus="changed"
      sdkVersion="28.0.0"
      visible
    />
  );

  expect(wrapper.state().clipboard).toEqual([]);

  wrapper.instance()._handleCopy('test/App.js');

  expect(wrapper.state().clipboard).toEqual([
    { item: { path: 'test/App.js', type: 'file', content: '' }, state: {} },
  ]);

  wrapper.instance()._handleClearClipboard();

  expect(wrapper.state().clipboard).toEqual([]);
});

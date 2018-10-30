/* @flow */

import * as React from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import { parse } from 'query-string';
import { isMobile } from '../../utils/detectPlatform';
import { type ConnectionMethod } from '../DeviceInstructions/DeviceInstructionsModal';
import { type PreferencesContextType } from './withPreferences';
import { type ThemeName } from './withThemeName';

export type PreferencesType = {
  deviceConnectionMethod: ConnectionMethod,
  devicePreviewPlatform: 'android' | 'ios',
  devicePreviewShown: boolean,
  editorMode: 'normal' | 'vim',
  fileTreeShown: boolean,
  panelsShown: boolean,
  panelType: 'errors' | 'logs',
  theme: ThemeName,
};

type Props = {
  testConnectionMethod?: ConnectionMethod,
  testPreviewPlatform?: 'android' | 'ios',
  children: React.Node,
};

type State = {
  preferences: PreferencesType,
};

const EDITOR_CONFIG_KEY = '__SNACK_EDITOR_CONFIG';

const defaults: PreferencesType = {
  deviceConnectionMethod: 'device-id',
  devicePreviewPlatform: 'android',
  devicePreviewShown: true,
  editorMode: 'normal',
  fileTreeShown: !isMobile(),
  panelsShown: false,
  panelType: 'errors',
  theme: 'light',
};

let overrides = {};

try {
  // Restore editor preferences from saved data
  if ('localStorage' in window) {
    overrides = JSON.parse(window.localStorage.getItem(EDITOR_CONFIG_KEY));
  }
} catch (e) {
  // Ignore error
}

try {
  // Set theme if passed in query params
  const { theme, platform } = parse(window.location.search);

  if (theme === 'light' || theme === 'dark') {
    overrides.theme = theme;
  }

  if (platform === 'android' || platform === 'ios') {
    overrides.devicePreviewPlatform = platform;
  }
} catch (e) {
  // Ignore error
}

export const PreferencesContext = React.createContext(((null: any): PreferencesContextType));

class PreferencesProvider extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      preferences: {
        ...defaults,
        ...overrides,

        // Set the values according to the priority: saved preference, test value, default value
        deviceConnectionMethod:
          overrides.deviceConnectionMethod ||
          this.props.testConnectionMethod ||
          defaults.deviceConnectionMethod,
        devicePreviewPlatform:
          overrides.devicePreviewPlatform ||
          this.props.testPreviewPlatform ||
          defaults.devicePreviewPlatform,
      },
    };
  }

  _persistPreferences = debounce(() => {
    try {
      localStorage.setItem(EDITOR_CONFIG_KEY, JSON.stringify(this.state.preferences));
    } catch (e) {
      // Ignore
    }
  }, 1000);

  _setPreferences = (overrides: $Shape<PreferencesType>) => {
    this.setState(
      state => ({
        preferences: {
          ...state.preferences,
          ...overrides,
        },
      }),
      this._persistPreferences
    );
  };

  render() {
    return (
      <PreferencesContext.Provider
        value={{
          setPreferences: this._setPreferences,
          preferences: this.state.preferences,
        }}>
        {this.props.children}
      </PreferencesContext.Provider>
    );
  }
}

export default connect(state => ({
  testPreviewPlatform: state.splitTestSettings.defaultPreviewPlatform,
  testConnectionMethod: state.splitTestSettings.defaultConnectionMethod,
}))(PreferencesProvider);

/* @flow */

import nullthrows from 'nullthrows';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import AuthManager from './authManager';
import type { Viewer } from '../types';

export type AuthProps = {|
  login: ({ username: string, password: string }) => Promise<{ success: boolean }>,
  logout: () => Promise<void>,
  getSessionSecret: () => string,
  getToken: () => string,
  setMetadata: ({ appetizeCode: string }) => Promise<void>,
  viewer?: ?Viewer,
  dispatch: ({ type: string, viewer: Viewer }) => mixed,
|};

const Auth = new AuthManager();

const enhanceWithAuthMethods = Comp => {
  return class WithAuthWrapper extends React.Component<*> {
    async componentDidMount() {
      const token = Auth.currentToken;
      const sessionSecret = Auth.currentSessionSecret;
      if (token || sessionSecret) {
        const viewer = await Auth.getProfile();
        this.props.dispatch({ type: 'UPDATE_VIEWER', viewer });
      }
    }

    _handleSessionSecret = () => {
      return AuthManager.get().currentSessionSecret;
    };

    _handleGetToken = () => {
      return AuthManager.get().currentToken;
    };

    // TODO(tc): replace this once we talk to graphql elsewhere
    _handleSetMetadata = async newMetadata => {
      if (!Auth.currentToken && !Auth.currentSessionSecret) {
        return null;
      }
      const endpoint = `${nullthrows(process.env.API_SERVER_URL)}/--/graphql`;
      try {
        const response = await fetch(`${endpoint}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(Auth.currentToken ? { Authorization: `Bearer ${Auth.currentToken}` } : {}),
            ...(Auth.currentSessionSecret ? { 'Expo-Session': Auth.currentSessionSecret } : {}),
          },
          body: JSON.stringify({
            query: `mutation ($newMetadata: UserDataInput!) {
                      me {
                        updateProfile(userData: $newMetadata) {
                          id
                        }
                      }
                    }`,
            variables: { newMetadata },
          }),
        });
        const json = await response.json();

        if (!json.errors) {
          const viewer = await Auth.getProfile();
          this.props.dispatch({
            type: 'UPDATE_VIEWER',
            viewer,
          });
        }
      } catch (e) {
        return null;
      }
    };

    _handleLogin = async ({ username, password }: { username: string, password: string }) => {
      try {
        const viewer = await Auth.loginWithUsernamePassword(username, password);
        if (viewer) {
          this.props.dispatch({ type: 'UPDATE_VIEWER', viewer });
          return { success: true };
        }
      } catch (e) {
        // TODO(jim): Tie in the error banner on Snack.
        return { success: false };
      }
    };

    _handleLogout = async () => {
      await Auth.logout();
      this.props.dispatch({ type: 'UPDATE_VIEWER', viewer: null });
    };

    render() {
      return (
        <Comp
          login={this._handleLogin}
          logout={this._handleLogout}
          getSessionSecret={this._handleSessionSecret}
          getToken={this._handleGetToken}
          setMetadata={this._handleSetMetadata}
          {...this.props}
        />
      );
    }
  };
};

export default function withAuth<Props: *, C: React.ComponentType<Props>>(
  Comp: C
): React.ComponentType<$Diff<React.ElementConfig<C>, AuthProps>> {
  return compose(
    connect((state): { viewer: any } => {
      return {
        viewer: state.viewer,
      };
    }),
    enhanceWithAuthMethods
  )(Comp);
}

import { createStore, combineReducers } from 'redux';

function viewer(state = null, action) {
  switch (action.type) {
    case 'UPDATE_VIEWER':
      return action.viewer;
    default:
      return state;
  }
}

function splitTestSettings(state = {}, action) {
  switch (action.type) {
    default:
      return state;
  }
}

export default function createStoreWithPreloadedState(state) {
  return createStore(
    combineReducers({
      viewer,
      splitTestSettings,
    }),
    state
  );
}

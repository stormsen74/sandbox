import {createStore, applyMiddleware, compose} from 'redux';
import rootReducer from 'reducers/rootReducer';
import thunk from 'redux-thunk';

const nextRootReducer = require('reducers/rootReducer');

const isProduction = process.env.NODE_ENV === 'production';
const composeEnhancers = isProduction
  ? compose
  : window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const appStore = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)));

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('reducers/rootReducer', () => {
    appStore.replaceReducer(nextRootReducer);
  });
}

export default appStore;

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import store from 'stores/store';
import ErrorBoundary from 'components/error/ErrorBoundary';
import IndexRoutes from 'routes/IndexRoutes';
import AppLauncher from 'utilities/AppLauncher';
import './index.scss';

class Index {
  constructor() {
    new AppLauncher().start(() => {
      Index.startIndexApp();
    });
  }

  static startIndexApp() {
    const dom = document.getElementById('app');
    ReactDOM.render(
      <ErrorBoundary>
        <Provider store={store}>
          <IndexRoutes/>
        </Provider>
      </ErrorBoundary>,
      dom,
    );
  }
}

window.__webpack_hash__ = 'index';
const index = new Index();
export default index;

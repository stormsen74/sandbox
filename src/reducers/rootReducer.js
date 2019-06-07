import {combineReducers} from 'redux';
import testReducer from './testReducer';
import uiReducer from './uiReducer';

export default combineReducers({
  test: testReducer,
  ui: uiReducer,
});

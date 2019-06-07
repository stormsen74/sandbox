import * as ActionType from 'constants/ActionType';

const initialState = {
  testValue: false,
};

export default function (state = initialState, action) {
  const {type, payload} = action;

  switch (type) {
    case ActionType.TEST: {
      const {testValue} = payload;
      return {...state, testValue};
    }

    default: {
      return state;
    }
  }
}

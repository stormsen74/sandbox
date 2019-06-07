import * as ActionType from 'constants/ActionType';

export function aTestAction(bool) {
  const payload = {
    testValue: bool,
  };

  return {
    type: ActionType.TEST,
    payload,
  };
}

export function anotherTestAction() {
  return {
    type: ActionType.TEST_ANOTHER,
  };
}

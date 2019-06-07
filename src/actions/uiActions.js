import * as ActionType from 'constants/ActionType';

export function resize() {
  return {
    type: ActionType.UI_RESIZE,
    payload: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
    },
  };
}

// human touch detection: https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685
export function initTouchDetection() {
  return (dispatch) => {
    let userHasTouchedTheScreen = false;
    const touchStartListener = () => {
      userHasTouchedTheScreen = true;
      window.removeEventListener('touchstart', touchStartListener, false);

      dispatch({
        type: ActionType.UI_TOUCH_DETECTION,
        payload: {
          humanTouch: userHasTouchedTheScreen,
        },
      });
    };
    window.addEventListener('touchstart', touchStartListener, false);

    dispatch({
      type: ActionType.UI_TOUCH_DETECTION,
      payload: {
        humanTouch: userHasTouchedTheScreen,
      },
    });
  };
}

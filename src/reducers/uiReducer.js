import * as ActionType from 'constants/ActionType';

const initialState = {
  width: 0,
  height: 0,
  pixelWidth: 0,
  pixelHeight: 0,
  humanTouch: false,
};

export default function (state = initialState, action) {
  const {type, payload} = action;

  switch (type) {
    case ActionType.UI_RESIZE: {
      const {width, height, pixelRatio} = payload;
      const pixelWidth = width * pixelRatio;
      const pixelHeight = height * pixelRatio;
      return {
        ...state,
        width,
        height,
        pixelWidth,
        pixelHeight,
      };
    }

    case ActionType.UI_TOUCH_DETECTION: {
      const {humanTouch} = payload;
      return {
        ...state,
        humanTouch,
      };
    }

    default: {
      return state;
    }
  }
}

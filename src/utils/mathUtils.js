/**
 * Created by STORMSEN on 06.12.2016.
 */

export const PI = 3.14159;
export const HALF_PI = 1.57079;
export const TWO_PI = 6.28318;

class mathUtils {

    constructor() {

    }

    static degToRad(deg) {

        return deg * 0.01745;

    }

    static radToDeg(rad) {

        return rad * 57.29577;

    }

    static getRandomBetween(min = 0, max = 1) {

        return min + Math.random() * (max - min);

    }

    static convertToRange(value, srcRange = [], dstRange = []) {

        if (value < srcRange[0] || value > srcRange[1]) return 0;

        let srcMax = srcRange[1] - srcRange[0], dstMax = dstRange[1] - dstRange[0], adjValue = value - srcRange[0];

        return (adjValue * dstMax / srcMax) + dstRange[0];
    }
}


// ——————————————————————————————————————————————————
// Exports
// ——————————————————————————————————————————————————

export default mathUtils;
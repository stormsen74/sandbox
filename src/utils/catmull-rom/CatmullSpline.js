import CatmullMatrix from "./CatmullMatrix";

class CatmullSpline {

  constructor(controlPoints) {
    this.points = controlPoints;
    this.functionCache = [];
    for (let i = 0; i < this.points.length - 3; i++) {
      this.functionCache.push([]);
    }

    const tau = 1.3;
    this.catmullRomMatrix = new CatmullMatrix(
      [0, 2, 0, 0],
      [-tau, 0, tau, 0],
      [2 * tau, tau - 6, -2 * (tau - 3), -tau],
      [-tau, 4 - tau, tau - 4, tau]
    );
    this.catmullRomMatrix.scalarMul(.5);
  }


  evaluate(rawT) {
    const i = Math.floor(rawT);
    const t = rawT % 1;
    if (i + 3 >= this.points.length) return false;

    const cx = this.getHermiteFunction(i, 0);
    const cy = this.getHermiteFunction(i, 1);

    return [
      cx.rows[0][0] + t * cx.rows[1][0] + t * t * cx.rows[2][0] + t * t * t * cx.rows[3][0],
      cy.rows[0][0] + t * cy.rows[1][0] + t * t * cy.rows[2][0] + t * t * t * cy.rows[3][0]
    ]
  }


  getHermiteFunction(p, index) {
    if (this.functionCache[p][index] == undefined) {
      this.functionCache[p][index] = this.catmullRomMatrix.mul(new CatmullMatrix([this.points[p][index]],
        [this.points[p + 1][index]], [this.points[p + 2][index]], [this.points[p + 3][index]]));
    }

    return this.functionCache[p][index];
  }


}


export default CatmullSpline

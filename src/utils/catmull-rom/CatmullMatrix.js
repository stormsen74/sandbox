class CatmullMatrix {

  constructor(...rows) {
    this.rows = rows;
    this.cols = [];
    for (let i = 0; i < rows[0].length; i++) {
      let col = [];
      for (let j = 0; j < this.rows.length; j++) {
        col.push(this.rows[j][i]);
      }
      this.cols.push(col);
    }
  }

  scalarMul = function (scalar) {
    for (let i = 0; i < this.rows.length; i++) {
      for (let j = 0; j < this.cols.length; j++) {
        this.rows[i][j] = this.rows[i][j] * scalar;
      }
    }
  }

  dot(v1, v2) {
    var sum = 0;
    for (let i = 0; i < v1.length; i++) {
      sum += v1[i] * v2[i];
    }
    return sum;
  }

  mul = function (other) {
    var result = [];
    for (let i = 0; i < this.rows.length; i++) {
      result.push([]);
      for (let j = 0; j < other.cols.length; j++) {
        result[i][j] = this.dot(this.rows[i], other.cols[j]);
      }
    }
    return new CatmullMatrix(...result);
  }


}

export default CatmullMatrix

import {Vector2} from "./vector2";
import * as PIXI from "pixi.js";

const DrawUtils = {};


DrawUtils.plotPoint = (layer, vPos, color = 0xffffff, r = 1.5) => {
  let point = new PIXI.Graphics();
  point.beginFill(color);
  point.drawCircle(0, 0, r);
  point.endFill();
  point.x = vPos.x;
  point.y = vPos.y;
  layer.addChild(point);
};

DrawUtils.plotLine = (layer, v1, v2, color = 0xffffff, width = 1, alpha = 1, blendMode = PIXI.BLEND_MODES.NORMAL) => {
  let line = new PIXI.Graphics();
  line.blendMode = blendMode;
  line.lineStyle(width, color, alpha);
  line.moveTo(v1.x, v1.y);
  line.lineTo(v2.x, v2.y);
  layer.addChild(line);
};

// Based on https://www.habrador.com/tutorials/math/5-line-line-intersection/
DrawUtils.lineIntersecting = (l1_start, l1_end, l2_start, l2_end) => {

  let isIntersecting = false;

  //Direction of the lines
  const l1_dir = Vector2.subtract(l1_end, l1_start).normalize();
  const l2_dir = Vector2.subtract(l2_end, l2_start).normalize();

  //If we know the direction we can get the normal vector to each line
  const l1_normal = new Vector2(-l1_dir.y, l1_dir.x);
  const l2_normal = new Vector2(-l2_dir.y, l2_dir.x);

  //Step 1: Rewrite the lines to a general form: Ax + By = k1 and Cx + Dy = k2
  //The normal vector is the A, B
  const A = l1_normal.x;
  const B = l1_normal.y;

  const C = l2_normal.x;
  const D = l2_normal.y;

  //To get k we just use one point on the line
  const k1 = (A * l1_start.x) + (B * l1_start.y);
  const k2 = (C * l2_start.x) + (D * l2_start.y);

  //Step 4: calculate the intersection point -> one solution
  const x_intersect = (D * k1 - B * k2) / (A * D - B * C);
  const y_intersect = (-C * k1 + A * k2) / (A * D - B * C);

  const intersectPoint = new Vector2(x_intersect, y_intersect);

  const IsBetween = (a, b, c) => {
    let isBetween = false;

    //Entire line segment
    const ab = Vector2.subtract(b, a);
    //The intersection and the first point
    const ac = Vector2.subtract(c, a);

    //Need to check 2 things:
    //1. If the vectors are pointing in the same direction = if the dot product is positive
    //2. If the length of the vector between the intersection and the first point is smaller than the entire line
    if (ab.dot(ac) > 0 && ab.lengthSq() >= ac.lengthSq()) {
      isBetween = true;
    }

    return isBetween;
  };

  if (IsBetween(l1_start, l1_end, intersectPoint) && IsBetween(l2_start, l2_end, intersectPoint)) {
    isIntersecting = true;
  }

  return isIntersecting ? intersectPoint : false
};


export default DrawUtils;

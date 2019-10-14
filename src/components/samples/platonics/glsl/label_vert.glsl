varying float cameraDist;
const vec3 origin = vec3(0.0);

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  cameraDist = distance(mvPosition, vec4(origin, 0.0));
  //  gl_PointSize = 100.0;
  gl_PointSize = 200.0 / cameraDist;
  gl_Position = projectionMatrix * mvPosition;
}

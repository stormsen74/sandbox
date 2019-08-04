#version 120

uniform float amplitude;
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;
void main() {
  vColor = customColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  //				gl_PointSize = size * ( 300.0 / -mvPosition.z );
  gl_PointSize = 200.0;
  gl_Position = projectionMatrix * mvPosition;
}

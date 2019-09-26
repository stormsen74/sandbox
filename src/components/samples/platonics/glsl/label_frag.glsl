precision highp float;

uniform sampler2D texture;

void main() {
  vec2 uv = gl_PointCoord;
  uv.y = 1.0 - uv.y;
  gl_FragColor = texture2D(texture, uv);
}

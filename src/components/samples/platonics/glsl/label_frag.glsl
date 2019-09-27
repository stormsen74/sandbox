precision highp float;

uniform sampler2D texture;
varying float cameraDist;

void main() {
  vec2 uv = gl_PointCoord;
  uv.y = 1.0 - uv.y;
  vec4 color = texture2D(texture, uv);
  gl_FragColor = color;
//  gl_FragColor.rgb = vec3(cameraDist);
  if (color.a < .5) discard;
}

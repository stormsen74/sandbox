precision highp float;

uniform sampler2D texture;
uniform sampler2D noise;
uniform vec4 innerEdgeColor;
uniform vec4 outerEdgeColor;
varying vec2 vUv;

uniform float time;
uniform float gradientOffset;

float range = 1.05;

void main() {

  vec4 color = texture2D(texture, vUv);
  vec4 noise = texture2D(noise, vUv);
  float dissolve = noise.r;
  float rate = mod(time / range, 1.0);
  float offset = rate + gradientOffset;

  if (dissolve < rate) discard;
  if (dissolve < offset) {
    float step = smoothstep(0.0, offset - rate, offset - dissolve);
    color = mix(outerEdgeColor, innerEdgeColor, step);
  }

  gl_FragColor = color;
  //    gl_FragColor = texture2D(texture, vUv);
}

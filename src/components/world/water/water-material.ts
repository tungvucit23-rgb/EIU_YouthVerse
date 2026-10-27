import { Color, FrontSide, ShaderMaterial, UniformsUtils, UniformsLib } from "three";

const vertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vSurfaceNormal;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec3 p = position;
    float middle = sin(uv.x * 3.14159265);
    p.y += (sin(position.x * 2.4 + uTime * 1.3) + cos(position.z * 2.0 - uTime)) * 0.007 * middle;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vSurfaceNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const fragmentShader = `
  uniform float uTime;
  uniform float uActive;
  uniform float uDirection;
  uniform float uFall;
  uniform vec3 uDeep;
  uniform vec3 uLight;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vSurfaceNormal;
  #include <fog_pars_fragment>
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
  }
  void main() {
    float flow = uTime * 0.42 * uDirection;
    vec2 coordinates = vec2(vUv.x * 8.0, vUv.y * 2.8 - flow);
    float ripples = noise(coordinates * 1.7) * 0.65 + noise(coordinates * 4.0 + flow * 0.3) * 0.35;
    float edge = abs(vUv.x * 2.0 - 1.0);
    float brokenEdge = edge + (noise(vec2(vUv.y * 3.5 - flow, vUv.x * 9.0)) - 0.5) * 0.09;
    float mask = 1.0 - smoothstep(0.9, 1.0, brokenEdge);
    float foam = smoothstep(0.72, 0.94, brokenEdge) * smoothstep(0.38, 0.72, ripples);
    float streak = pow(max(0.0, sin(vUv.y * 19.0 - flow * 8.0 + noise(coordinates) * 6.0)), 19.0) * smoothstep(0.55, 0.9, ripples);
    vec3 viewDirection = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - abs(dot(viewDirection, normalize(vSurfaceNormal))), 3.0);
    vec3 water = mix(uDeep, uLight, ripples * 0.6 + fresnel * 0.25);
    water = mix(water, vec3(0.87, 0.96, 0.96), foam * 0.8 + streak * 0.38);
    water += uActive * vec3(0.015, 0.035, 0.045);
    float alpha = (0.57 + fresnel * 0.06 + foam * 0.09 + uActive * 0.12 + uFall * 0.04) * mask;
    gl_FragColor = vec4(water, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export function createWaterMaterial(fall = false) {
  return new ShaderMaterial({
    uniforms: { ...UniformsUtils.clone(UniformsLib.fog), uTime: { value: 0 }, uActive: { value: 0.1 }, uDirection: { value: 1 }, uFall: { value: fall ? 1 : 0 }, uDeep: { value: new Color("#3a97aa") }, uLight: { value: new Color("#b2d9d7") } },
    vertexShader, fragmentShader, transparent: true, depthWrite: true, side: FrontSide, fog: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
}

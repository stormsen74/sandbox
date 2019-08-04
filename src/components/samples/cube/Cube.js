import React from 'react';
import connect from "react-redux/es/connect/connect";
import * as THREE from 'three';
import 'gsap/TweenMax';
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
// import point_vert from 'point_vert.glsl';
// import point_frag from 'point_frag.glsl';


const DEVELOPMENT = process.env.NODE_ENV === 'development';
const VR_BG_COLOR = 0x000000;

class Cube extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);

  }


  // https://discoverthreejs.com/tips-and-tricks/

  componentDidMount() {
    this.initThree();
    requestAnimationFrame(this.draw);


    TweenMax.to(this.canvasWrapper, .5, {delay: .5, opacity: 1, ease: Cubic.easeIn});

    window.addEventListener('resize', this.onResize, true);
    this.onResize();
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }

  vertexShader() {
    return `
    uniform float amplitude;
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    varying vec3 vPos;
    
    void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vPos = mvPosition.xyz;
    //gl_PointSize = 1.0 * ( 10.0 / mvPosition.z );
    gl_PointSize = 50.0;
    //gl_PointSize = mvPosition.z*1000.0;
    gl_Position = projectionMatrix * mvPosition;
}
  `
  }

  fragmentShader() {
    return `
    uniform vec3 color;
    //uniform sampler2D texture;
    varying vec3 vColor;
    varying vec3 vPos;
    void main() {
      float d = vPos.x;
      vec3 newColor = vec3(d, d, d);
      gl_FragColor = vec4( newColor, 1.0 );
      //gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
}
  `
  }

  initPoint() {
    let vertices = [-.5, .5, .5];
    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    let pointShader = new THREE.ShaderMaterial({
      uniforms: {
        amplitude: {value: 1.0},
        size: {value: 100.0},
        color: {value: new THREE.Color(Math.random() * 0xFFFFFF)},
      },
      vertexShader: this.vertexShader(),
      fragmentShader: this.fragmentShader(),
      depthTest: true,
      transparent: true
    });

    let points = new THREE.Points(geometry, pointShader);
    this.cube.add(points);
  }


  initThree() {
    const options = {canvas: this.canvas, antialias: true};
    this.renderer = new THREE.WebGLRenderer(options);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VR_BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 0, 0);

    this.initControls();

    let geometry = new THREE.BoxGeometry(1, 1, 1);
    let material = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.position.z = 0;
    this.scene.add(this.cube);

    this.initPoint();
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }


  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor = 0.15;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  update() {
    // this.cube.rotation.x += .03;
    // this.cube.rotation.y += .03;

    this.controls.update();
  }


  draw() {

    requestAnimationFrame(this.draw);

    this.update();
    this.renderer.render(this.scene, this.camera);
  }


  render() {
    return (
      <div>
        <div style={{overflow: 'hidden'}} className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}>
          <canvas ref={ref => this.canvas = ref}/>
        </div>
        <a href={'/'}>
          <CloseIcon fill={'#ffffff'} className="close-icon"/>
        </a>
      </div>

    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {})(Cube);


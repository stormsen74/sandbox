import React from 'react';
import connect from "react-redux/es/connect/connect";
import * as THREE from 'three';
import {Vector3} from 'three';
import 'gsap/TweenMax';
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import point_vert from '../cube/point_vert.glsl';
import point_frag from '../cube/point_frag.glsl';
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

  getCanvasTexture = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    ctx.font = "128px Verdana";
    ctx.textBaseline = "middle";
    const n = 23;
    const txt = n.toString();
    const lineWidth = 10;

    ctx.beginPath();
    ctx.arc(size * .5, size * .5, size * .5 - lineWidth, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(88,12,7,0.65)';
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#f1be2a';
    ctx.stroke();

    ctx.fillStyle = 'rgb(128,169,233)';
    ctx.fillText(txt, size * .5 - ctx.measureText(txt).width * .5, size * .5);

    return canvas;

  };

  initPoint = () => {
    // let texture = new THREE.TextureLoader().load(image);
    //
    const texture = new THREE.CanvasTexture(this.getCanvasTexture());

    let vertices = [-.5, .5, .5];
    let geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    let pointShader = new THREE.ShaderMaterial({
      uniforms: {
        // amplitude: {value: 1.0},
        // color: {value: new THREE.Color(Math.random() * 0xffffff)},
        texture: {type: 't', value: texture}
      },
      vertexShader: point_vert,
      fragmentShader: point_frag,
      depthTest: true,
      transparent: true,
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
    this.tubeTest();
  }


  tubeTest() {
    const start = new Vector3(-1, 0, 0);
    const end = new Vector3(1, 0, 0);
    const path = new THREE.LineCurve3(start, end);
    const geometry = new THREE.TubeGeometry(path, 20, .3, 3, true);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide});
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
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


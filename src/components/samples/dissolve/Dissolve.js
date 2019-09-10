import React from 'react';
import connect from "react-redux/es/connect/connect";
import * as THREE from 'three';
import {Color} from 'three';
import 'gsap/TweenMax';
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import baseTexture from '../dissolve/texture.png';
import noiseTexture from '../dissolve/diamond.jpg';
import dissolve_vert from '../dissolve/dissolve_vert.glsl';
import dissolve_frag from '../dissolve/dissolve_frag.glsl';
import * as dg from "dis-gui";


const DEVELOPMENT = process.env.NODE_ENV === 'development';
const VR_BG_COLOR = new Color('#787878');

class Dissolve extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onUpdateTime = this.onUpdateTime.bind(this);
    this.onUpdateGradientOffset = this.onUpdateGradientOffset.bind(this);

    this.params = {
      time: 0.0,
      gradientOffset: .04
    };

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


  initCube() {
    let texture = new THREE.TextureLoader().load(baseTexture);
    let noise = new THREE.TextureLoader().load(noiseTexture);

    const innerEdgeColor = new THREE.Color('#000000');
    const outerEdgeColor = new THREE.Color('#0efaff');


    let dissolveShader = new THREE.ShaderMaterial({
      uniforms: {
        time: {type: 'f', value: this.params.time},
        gradientOffset: {type: 'f', value: this.params.gradientOffset},
        texture: {type: 't', value: texture},
        noise: {type: 't', value: noise},
        innerEdgeColor: {type: 'v', value: new THREE.Vector4(innerEdgeColor.r, innerEdgeColor.g, innerEdgeColor.b, 0.6)},
        outerEdgeColor: {type: 'v', value: new THREE.Vector4(outerEdgeColor.r, outerEdgeColor.g, outerEdgeColor.b, 1.0)},
      },
      vertexShader: dissolve_vert,
      fragmentShader: dissolve_frag,
      // depthTest: true,
      transparent: true,
      side: THREE.DoubleSide
    });

    let geometry = new THREE.BoxGeometry(1, 1, 1);
    this.cube = new THREE.Mesh(geometry, dissolveShader);
    this.cube.position.z = 0;
    this.scene.add(this.cube);


  }


  onUpdateTime(time) {
    this.params.time = time;
    this.cube.material.uniforms.time.value = this.params.time;
  }

  onUpdateGradientOffset(gradientOffset) {
    this.params.gradientOffset = gradientOffset;
    this.cube.material.uniforms.gradientOffset.value = this.params.gradientOffset;
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


    this.initCube();
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
    this.controls.minDistance = 2;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  update() {

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
        <dg.GUI>
          <dg.Number label='Time' value={this.params.time} min={0.0} max={1.0} step={0.01} onChange={this.onUpdateTime}/>
          <dg.Number label='GradientOffset' value={this.params.gradientOffset} min={0.0} max={0.5} step={0.001} onChange={this.onUpdateGradientOffset}/>
        </dg.GUI>
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

export default connect(mapStateToProps, {})(Dissolve);


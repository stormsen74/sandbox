import React from 'react';
import connect from "react-redux/es/connect/connect";
import * as THREE from 'three';
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import types from "./PlatonicTypes";

import CloseIcon from '../../../core/icons/close.inline.svg';
import '../Scene.scss'

import 'react-dat-gui/build/react-dat-gui.css';

import * as dg from 'dis-gui';


const DEVELOPMENT = process.env.NODE_ENV === 'development';
const VR_BG_COLOR = 0x363636;


const platonic_types = ['hexahedron', 'tetrahedron', 'octahedron', 'icosahedron', 'dodecahedron']

class Platonics extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onChangeType = this.onChangeType.bind(this);
    this.onChangeRadius = this.onChangeRadius.bind(this);
    this.onChangeLevel = this.onChangeLevel.bind(this);
    this.viewMesh = this.viewMesh.bind(this);
    this.viewNormals = this.viewNormals.bind(this);
    this.showGrid = this.showGrid.bind(this);


    this.platonic = {
      type: 'hexahedron',
      radius: 1,
      level: 0,
      mesh: null,
      edgeLines: null,
      vertexNormals: null
    };

    this.ui = {
      showMesh: true,
      showNormals: false,
      showGrid: false
    }

  }


// https://discoverthreejs.com/tips-and-tricks/


  componentDidMount() {

    this.initThree();
    this.initPlatonic(types[this.platonic.type], this.platonic.radius, this.platonic.level);

    window.addEventListener('resize', this.onResize, true);
    this.onResize();

    requestAnimationFrame(this.draw);
    TweenMax.to(this.canvasWrapper, .5, {delay: .5, opacity: 1, ease: Cubic.easeIn});
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize, true);
  }


  initThree() {
    const options = {canvas: this.canvas, antialias: true};
    this.renderer = new THREE.WebGLRenderer(options);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VR_BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000);
    this.camera.position.set(0, 0, 0);

    let light = new THREE.AmbientLight(0xffffff, .5);
    this.scene.add(light);

    // ui
    this.initControls();
    this.showGrid(this.ui.showGrid)

  }

  updateGeometry() {

    if (this.platonic.mesh != null) {
      this.platonic.mesh.geometry.clearGroups();
      this.scene.remove(this.platonic.mesh);
      this.platonic.mesh.geometry.dispose();
      if (this.platonic.mesh.material.length > 0) {
        this.platonic.mesh.material.forEach(material => {
          material.dispose();
        });
      } else {
        this.platonic.mesh.material.dispose();
      }


      this.platonic.mesh = undefined;
    }

    if (this.platonic.edgeLines != null) {
      this.scene.remove(this.platonic.edgeLines);
      this.platonic.edgeLines = null;
    }

    if (this.platonic.vertexNormals != null) {
      this.scene.remove(this.platonic.vertexNormals);
      this.platonic.vertexNormals = null;

    }

    this.initPlatonic(types[this.platonic.type], this.platonic.radius, this.platonic.level);

  }

  setVertexColors(platonic_geometry) {
    const count = platonic_geometry.attributes.position.count;
    platonic_geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    let color = new THREE.Color();
    color.setRGB(.3, .3, .3)
    let positions = platonic_geometry.attributes.position;
    let colors = platonic_geometry.attributes.color;
    for (let i = 0; i < count; i++) {
      // color.setHSL((positions.getY(i) / radius + 1) / 2, 1.0, 0.5);
      let vPos = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
      let vCount_1 = 0;
      let vCount_2 = 5;
      let vType_1 = new THREE.Vector3(
        types.octahedron.vertices[vCount_1 * 3],
        types.octahedron.vertices[vCount_1 * 3 + 1],
        types.octahedron.vertices[vCount_1 * 3 + 2]
      );
      let vType_2 = new THREE.Vector3(
        types.octahedron.vertices[vCount_2 * 3],
        types.octahedron.vertices[vCount_2 * 3 + 1],
        types.octahedron.vertices[vCount_2 * 3 + 2]
      );
      if (vPos.equals(vType_1) || vPos.equals(vType_2)) {
        console.log('match')
        color.setRGB(0, 1, 0);
      } else {
        color.setRGB(.3, .3, .3);
      }
      colors.setXYZ(i, color.r, color.g, color.b);
    }
  }


  setMaterials(_geometry) {

    const faceCount = _geometry.attributes.position.count / 3;
    let materials = [];
    for (let i = 0; i < faceCount; i++) {
      _geometry.addGroup(i * 3, 3, i); // first 3 vertices use material 0
      materials.push(new THREE.MeshBasicMaterial({color: Math.random()*0xffffff}),)
    }

    return materials;
  }


  applyVertexMaterial(_geometry) {

    this.setVertexColors(_geometry);

    let material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
      vertexColors: THREE.VertexColors,
      shininess: 0
    });

    return material;
  }


  initPlatonic(type, radius = 1, subdivision = 0) {

    // TODO => vertex color | shading | ico

    if (type != undefined) {
      console.log('initPlatonic', type, radius, subdivision);

      let platonic_geometry = new THREE.PolyhedronBufferGeometry(type.vertices, type.indices, radius, subdivision);


      // this.setVertexColors(platonic_geometry);


      // let material = new THREE.MeshNormalMaterial();
      let material = this.applyVertexMaterial(platonic_geometry);
      let materials = this.setMaterials(platonic_geometry);


      // material.side = THREE.DoubleSide; //TODO check Tetrahedron Geometry - flipped normals?
      this.platonic.mesh = new THREE.Mesh(platonic_geometry, material);

      let edges = new THREE.EdgesGeometry(platonic_geometry);
      this.platonic.edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffef68}));

      this.platonic.vertexNormals = new THREE.VertexNormalsHelper(this.platonic.mesh, .1, 0xff0000, 1);


      this.scene.add(this.platonic.mesh);
      this.scene.add(this.platonic.edgeLines);
      this.scene.add(this.platonic.vertexNormals);

      this.platonic.vertexNormals.visible = this.ui.showNormals;
      this.platonic.mesh.visible = this.ui.showMesh;

    }
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
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 5;
    // this.controls.maxPolarAngle = Math.PI / 2;
  }

  update() {
    this.controls.update();
  }


  draw() {
    requestAnimationFrame(this.draw);
    this.update();
    this.renderer.render(this.scene, this.camera);
  }


  onChangeType(type) {
    if (type !== this.platonic.type) {
      this.platonic.type = type;
      this.updateGeometry();
    }
  }

  onChangeRadius(radius) {
    if (radius !== this.platonic.radius) {
      this.platonic.radius = radius;
      this.updateGeometry();
    }
  }

  onChangeLevel(level) {
    if (level !== this.platonic.level) {
      this.platonic.level = level;
      this.updateGeometry();
    }
  }

  viewMesh(visible) {
    this.ui.showMesh = visible;
    if (this.platonic.mesh) this.platonic.mesh.visible = this.ui.showMesh
  }

  viewNormals(visible) {
    this.ui.showNormals = visible;
    if (this.platonic.vertexNormals) this.platonic.vertexNormals.visible = this.ui.showNormals;
  }

  showGrid(visible) {
    if (visible) {
      const grid = new THREE.GridHelper(2, 4, 0x0000ff, 0x808080);
      grid.name = 'grid';
      this.scene.add(grid);
    } else {
      let _grid = this.scene.getObjectByName('grid');
      this.scene.remove(_grid);
      _grid = null;
    }
  }

  render() {
    return (
      <div>
        <div style={{overflow: 'hidden'}} className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}>
          <canvas ref={ref => this.canvas = ref}/>
        </div>
        <dg.GUI>
          <dg.Select label='Platonic Type' options={platonic_types} onFinishChange={this.onChangeType}/>
          <dg.Number label='Radius' value={this.platonic.radius} min={1} max={6} step={0.1} onFinishChange={this.onChangeRadius}/>
          <dg.Number label='Level' value={this.platonic.level} min={0} max={4} step={1} onChange={this.onChangeLevel}/>
          <dg.Checkbox label='showMesh' checked={this.ui.showMesh} onFinishChange={this.viewMesh}/>
          <dg.Checkbox label='showNormals' checked={this.ui.showNormals} onFinishChange={this.viewNormals}/>
          <dg.Checkbox label='showGrid' checked={this.ui.showGrid} onFinishChange={this.showGrid}/>
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

export default connect(mapStateToProps, {})(Platonics);


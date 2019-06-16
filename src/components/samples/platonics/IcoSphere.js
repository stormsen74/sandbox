import React from 'react';
import connect from "react-redux/es/connect/connect";
import * as THREE from 'three';
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import {types, PLATONIC_TYPE} from "./PlatonicTypes";

import CloseIcon from '../../../core/icons/close.inline.svg';
import '../Scene.scss'

import 'react-dat-gui/build/react-dat-gui.css';

import * as dg from 'dis-gui';
import {Vector3} from "three";


const DEVELOPMENT = process.env.NODE_ENV === 'development';
const VR_BG_COLOR = 0x363636;


class IcoSphere extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onChangeLevel = this.onChangeLevel.bind(this);
    this.viewMesh = this.viewMesh.bind(this);
    this.viewNormals = this.viewNormals.bind(this);
    this.showGrid = this.showGrid.bind(this);
    this.addEdgeLines = this.addEdgeLines.bind(this);


    this.icoSphere = {
      type: PLATONIC_TYPE.ICOSAHEDRON,
      radius: 1,
      level: 0,
      mesh: null,
      edges: [],
      edgeLines: null,
      vertexNormals: null
    };

    this.ui = {
      showMesh: true,
      showNormals: false,
      showGrid: false
    }

  }


  componentDidMount() {

    this.initThree();
    this.initIcoSphere(types[PLATONIC_TYPE.ICOSAHEDRON], this.icoSphere.radius, this.icoSphere.level);

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

    if (this.icoSphere.mesh != null) {
      this.icoSphere.mesh.geometry.clearGroups();
      this.scene.remove(this.icoSphere.mesh);
      this.icoSphere.mesh.geometry.dispose();
      if (this.icoSphere.mesh.material.length > 0) {
        this.icoSphere.mesh.material.forEach(material => {
          material.dispose();
        });
      } else {
        this.icoSphere.mesh.material.dispose();
      }
      this.icoSphere.mesh = null;
    }

    // TODO clear edge materials?
    if (this.icoSphere.edgeLines != null) {
      this.scene.remove(this.icoSphere.edgeLines);
      this.icoSphere.edgeLines = null;
    }

    if (this.icoSphere.vertexNormals != null) {
      this.scene.remove(this.icoSphere.vertexNormals);
      this.icoSphere.vertexNormals = null;
    }

    this.initIcoSphere(types[PLATONIC_TYPE.ICOSAHEDRON], this.icoSphere.radius, this.icoSphere.level);

  }

  addEdgeLines(group) {

    let edges = this.icoSphere.edges;

    const maxL = Math.max(...this.icoSphere.edges.map(o => o.length), 0);


    let material;
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];

      material = new THREE.LineBasicMaterial({color: 0xff0000});
      if (edge.length > .5) {
        material = new THREE.LineBasicMaterial({color: 0x00ff00});
      }

      const geometry = new THREE.Geometry();
      geometry.vertices.push(
        edges[i].start,
        edges[i].end
      );

      const line = new THREE.Line(geometry, material);
      group.add(line);
    }
  }


  getByValue(arr, value) {
    for (let i = 0, iLen = arr.length; i < iLen; i++) {
      if (arr[i]._indices === value) return arr[i];
    }
  }


  initIcoSphere(type, radius = 1, subdivision = 0) {

    // TODO => vertex color | shading |
    // TODO => vertice labels

    if (type != undefined) {
      console.log('initIcoSphere', type, radius, subdivision);

      // 1. => geometry
      let platonic_geometry = new THREE.PolyhedronGeometry(type.vertices, type.indices, radius, subdivision);
      platonic_geometry.computeFaceNormals();

      let mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        flatShading: false,
        side: THREE.DoubleSide,
        wireframe: false,
        transparent: true,
        opacity: .75,
        vertexColors: THREE.FaceColors,
      });

      let color = new THREE.Color();
      let faces = platonic_geometry.faces;
      let vertices = platonic_geometry.vertices;
      const range = 1 / faces.length;

      // => set indices / get edge-count
      for (let v = 0; v < vertices.length; v++) {
        let vertice = vertices[v];
        vertice._neighbours = 0;
        vertice._index = v;
        for (let i = 0; i < faces.length; i++) {
          let face = faces[i];
          if (face.a === v || face.b === v || face.c === v) {
            vertice._neighbours++;
          }
        }
      }

      // face colors
      for (let i = 0; i < faces.length; i++) {
        color.setHSL(.5, .5, .2);
        let face = faces[i];
        vertices.forEach(vertice => {
          if (vertice._neighbours === 5) {
            if (face.a === vertice._index || face.b === vertice._index || face.c === vertice._index) {
              color.setHSL(.6, .5, .2);
            }
          }
        });
        face.color.set(color);
      }


      // edges
      let edges = [];
      let indices = [];
      for (let i = 0; i < faces.length; i++) {
        let face = faces[i];

        let ab = [face.a, face.b];
        let bc = [face.b, face.c];
        let ca = [face.c, face.a];

        const length_ab = vertices[ab[0]].distanceTo(vertices[ab[1]]);
        const length_bc = vertices[bc[0]].distanceTo(vertices[bc[1]]);
        const length_ca = vertices[ca[0]].distanceTo(vertices[ca[1]]);

        let compareNumbers = (a, b) => {
          return a - b;
        };

        ab.sort(compareNumbers);
        bc.sort(compareNumbers);
        ca.sort(compareNumbers);

        let edge_ab = {start: vertices[ab[0]], end: vertices[ab[1]], length: length_ab, _indices: ab.toString()};
        let edge_bc = {start: vertices[bc[0]], end: vertices[bc[1]], length: length_bc, _indices: bc.toString()};
        let edge_ca = {start: vertices[ca[0]], end: vertices[ca[1]], length: length_ca, _indices: ca.toString()};

        edges.push(edge_ab, edge_bc, edge_ca)
        indices.push(ab.toString(), bc.toString(), ca.toString())
      }

      // remove duplicate edges
      let removeDuplicates = [...new Set(indices)];
      this.icoSphere.edges = [];
      for (let i = 0; i < removeDuplicates.length; i++) {
        let edge = this.getByValue(edges, removeDuplicates[i]);
        this.icoSphere.edges.push(edge);
      }

      // edgeLines geometry
      this.icoSphere.edgeLines = new THREE.Group();
      this.addEdgeLines(this.icoSphere.edgeLines);


      // 2. => to buffer
      let platonic_buffer_geometry = new THREE.BufferGeometry().fromGeometry(platonic_geometry);


      this.icoSphere.mesh = new THREE.Mesh(platonic_buffer_geometry, mat);
      this.icoSphere.vertexNormals = new THREE.VertexNormalsHelper(this.icoSphere.mesh, .1, 0xff0000, 1);


      this.scene.add(this.icoSphere.mesh);
      this.scene.add(this.icoSphere.edgeLines);
      this.scene.add(this.icoSphere.vertexNormals);

      this.icoSphere.vertexNormals.visible = this.ui.showNormals;
      this.icoSphere.mesh.visible = this.ui.showMesh;

      console.log(this.icoSphere)
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


  onChangeLevel(level) {
    if (level !== this.icoSphere.level) {
      this.icoSphere.level = level;
      this.updateGeometry();
    }
  }

  viewMesh(visible) {
    this.ui.showMesh = visible;
    if (this.icoSphere.mesh) this.icoSphere.mesh.visible = this.ui.showMesh
  }

  viewNormals(visible) {
    this.ui.showNormals = visible;
    if (this.icoSphere.vertexNormals) this.icoSphere.vertexNormals.visible = this.ui.showNormals;
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
          <dg.Number label='Level' value={this.icoSphere.level} min={0} max={4} step={1} onChange={this.onChangeLevel}/>
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

export default connect(mapStateToProps, {})(IcoSphere);


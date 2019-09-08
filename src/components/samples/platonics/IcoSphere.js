import React from 'react';
import * as THREE from 'three';
import {Vector2, Vector3} from 'three';
import {PolyhedronGeometry} from '../../../webgl/three/geometries/PolyhedronGeometry'
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import {PLATONIC_TYPE, types} from "./PlatonicTypes";

import CloseIcon from '../../../core/icons/close.inline.svg';
import '../Scene.scss'

import 'react-dat-gui/build/react-dat-gui.css';

import * as dg from 'dis-gui';
import mathUtils from "../../../utils/mathUtils";


const DEVELOPMENT = process.env.NODE_ENV === 'development';
const VR_BG_COLOR = 0x363636;


class IcoSphere extends React.Component {
  constructor(props) {
    super(props);

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onChangeLevel = this.onChangeLevel.bind(this);
    this.onUpdateSlice = this.onUpdateSlice.bind(this);
    this.viewMesh = this.viewMesh.bind(this);
    this.viewLines = this.viewLines.bind(this);
    this.viewNormals = this.viewNormals.bind(this);
    this.showGrid = this.showGrid.bind(this);
    this.showAxis = this.showAxis.bind(this);
    this.toggleProjection = this.toggleProjection.bind(this);
    this.toggleOffsetVertices = this.toggleOffsetVertices.bind(this);


    this.icoSphere = {
      type: PLATONIC_TYPE.ICOSAHEDRON,
      radius: 1,
      level: 2,
      mesh: null,
      edges: [],
      edgeLines: [],
      vertexNormals: null
    };

    this.ui = {
      projectToSphere: false,
      projectVert: true,
      slice: 0,
      sliceValue: -this.icoSphere.radius,
      offsetVertices: false,
      showMesh: false,
      showLines: true,
      showNormals: false,
      showGrid: false,
      showAxis: false
    }

  }


  componentDidMount() {

    this.initThree();
    this.initIcoSphere(types[PLATONIC_TYPE.ICOSAHEDRON], this.icoSphere.radius, this.icoSphere.level, this.ui.projectVert);

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
    this.showAxis(this.ui.showAxis)

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

    if (this.icoSphere.edgeLines.length > 0) {
      this.clearEdgeLines();
    }

    if (this.icoSphere.vertexNormals != null) {
      this.scene.remove(this.icoSphere.vertexNormals);
      this.icoSphere.vertexNormals = null;
    }

    this.initIcoSphere(types[PLATONIC_TYPE.ICOSAHEDRON], this.icoSphere.radius, this.icoSphere.level, this.ui.projectVert);

  }

  createEdges(vertices, faces) {
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

      let del_ab = vertices[ab[0]]._delete || vertices[ab[1]]._delete;
      let del_bc = vertices[bc[0]]._delete || vertices[bc[1]]._delete;
      let del_ca = vertices[ca[0]]._delete || vertices[ca[1]]._delete;

      let edge_ab = {start: vertices[ab[0]], end: vertices[ab[1]], length: length_ab, _indices: ab.toString(), _delete: del_ab};
      let edge_bc = {start: vertices[bc[0]], end: vertices[bc[1]], length: length_bc, _indices: bc.toString(), _delete: del_bc};
      let edge_ca = {start: vertices[ca[0]], end: vertices[ca[1]], length: length_ca, _indices: ca.toString(), _delete: del_ca};

      edges.push(edge_ab, edge_bc, edge_ca);
      indices.push(ab.toString(), bc.toString(), ca.toString())
    }

    // remove duplicate edges
    const removeDuplicates = [...new Set(indices)];
    this.icoSphere.edges = [];
    for (let i = 0; i < removeDuplicates.length; i++) {
      let edge = this.getByValue(edges, removeDuplicates[i]);
      this.icoSphere.edges.push(edge);
    }
  }

  clearEdgeLines() {
    for (let i = 0; i < this.icoSphere.edgeLines.length; i++) {
      this.icoSphere.edgeLines[i].material.dispose();
      this.icoSphere.layerEdgeLines.remove(this.icoSphere.edgeLines[i]);
    }
    this.icoSphere.edgeLines = [];
  }

  createEdgeLines() {

    this.icoSphere.layerEdgeLines = new THREE.Object3D();

    const edges = this.icoSphere.edges;

    let _edgeLengths = [];
    for (let i = 0; i < edges.length; i++) {
      const edgeLength = parseFloat(edges[i].length.toFixed(5));
      _edgeLengths.push(edgeLength);
    }
    // remove duplicates
    const edgeLengths = [...new Set(_edgeLengths)];

    const compareNumbers = (a, b) => {
      return a - b
    };
    edgeLengths.sort(compareNumbers);
    console.log('create-edge-lines >', edgeLengths);

    const edgeColors = [
      new THREE.Color('#f1090d'),
      new THREE.Color('#5798c2'),
      new THREE.Color('#ff8a27'),
      new THREE.Color('#02c2bf'),
      new THREE.Color('#ff07f8'),
      new THREE.Color('#e7e405'),
      new THREE.Color('#5ce759'),
      new THREE.Color('#3838cf'),
      new THREE.Color('#4ad1e7'),
    ];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const material = new THREE.LineBasicMaterial();
      edgeLengths.forEach((l, index) => {
        const edgeLength = parseFloat(edge.length.toFixed(5));
        if (edgeLength === l) {
          material.color.set(edgeColors[index])
        }
      });

      const edgeGeometry = new THREE.Geometry();
      if (!edge._delete) {
        edgeGeometry.vertices.push(edge.start, edge.end);
        const edgeLine = new THREE.Line(edgeGeometry, material);
        this.icoSphere.edgeLines.push(edgeLine);
        this.icoSphere.layerEdgeLines.add(edgeLine);
      }
    }


  }

  offsetVerticesForPrint(vertices) {
    for (let v = 0; v < vertices.length; v++) {
      let vert = vertices[v];
      // => offset = f(y)
      // vert.y = 0;

      const vxz = new Vector2(vert.x, vert.z);
      // const offset = mathUtils.convertToRange(vert.y, [-this.icoSphere.radius, this.icoSphere.radius], [0, 1]);
      const offset = this.icoSphere.radius - Math.abs(vert.y)
      vxz.multiplyScalar(offset);
      vert.add(new Vector3(vxz.x, 0, vxz.y))
    }
  }

  getByValue(arr, value) {
    for (let i = 0, iLen = arr.length; i < iLen; i++) {
      if (arr[i]._indices === value) return arr[i];
    }
  }


  setProjection(vertices, subdivision, radius, projectToSphere) {
    for (let v = 0; v < vertices.length; v++) {
      const vert = vertices[v];
      if (subdivision === 1) {
        vert.normalize().multiplyScalar(radius)
      } else {
        if (projectToSphere) {
          vert.normalize().multiplyScalar(radius)
        } else {
          vert.multiplyScalar(radius * .525)
        }
      }
    }
  }

  initIcoSphere(type, radius = 1, subdivision = 0, projectToSphere = false) {

    // TODO => vertice labels
    // TODO => add lighting/shadow-plane
    // TODO => layout/print statistics

    if (type !== undefined) {
      // console.log('initIcoSphere', type, radius, subdivision, projectToSphere);

      // 1. => geometry
      const platonic_geometry = new PolyhedronGeometry(type.vertices, type.indices, radius, subdivision);
      platonic_geometry.rotateZ(THREE.Math.degToRad(58.25 + 90));
      platonic_geometry.computeFaceNormals();
      const faces = platonic_geometry.faces;
      const vertices = platonic_geometry.vertices;

      this.setProjection(vertices, subdivision, radius, projectToSphere);
      this.createEdges(vertices, faces);
      this.createEdgeLines();

      // => set indices / get edge-count
      for (let v = 0; v < vertices.length; v++) {
        const vert = vertices[v];
        vert._delete = vert.y <= this.ui.sliceValue;
        vert._edges = [];
        vert._index = v;

        for (let i = 0; i < this.icoSphere.edges.length; i++) {
          const edge = this.icoSphere.edges[i];
          let indices = edge._indices.split(',');
          indices = indices.map((i) => {
            return ~~i;
          });

          if (indices[0] === v || indices[1] === v) {
            vert._edges.push(edge);
          }
        }

      }

      // face colors
      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        let matIndex = 1;

        vertices.forEach(vertice => {
          if (vertice._delete === true) {
            if (face.a === vertice._index || face.b === vertice._index || face.c === vertice._index) face._delete = true;
          }
          if (vertice._edges.length === 5 && vertice._delete === false) {
            if (face.a === vertice._index || face.b === vertice._index || face.c === vertice._index) {
              matIndex = 2;
            }
          }
        });

        face.materialIndex = matIndex;
      }

      if (this.ui.offsetVertices) this.offsetVerticesForPrint(vertices);


      // console.log(vertices);
      // console.log(faces);

      // TODO => generate new Geometry

      let _vertices = [];
      let _faces = [];
      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        if (face._delete) {
          face.materialIndex = 0;
        } else {
          _faces.push(face);
        }
      }

      for (let i = 0; i < vertices.length; i++) {
        const vert = vertices[i];
        if (!vert._delete) _vertices.push(vert)
      }

      // console.log('>', _vertices);
      // console.log('>', _faces);


      // 2. => to buffer
      const platonic_buffer_geometry = new THREE.BufferGeometry().fromGeometry(platonic_geometry);
      const faceMaterials = [
        new THREE.MeshBasicMaterial({flatShading: true, depthTest: true, color: 0xff0000, transparent: true, opacity: .05}),
        new THREE.MeshNormalMaterial(),
        new THREE.MeshBasicMaterial({color: 0x0000cc}),
        new THREE.MeshBasicMaterial({color: 0xcc0000})
      ];

      this.icoSphere.mesh = new THREE.Mesh(platonic_buffer_geometry, faceMaterials);
      this.icoSphere.vertexNormals = new THREE.VertexNormalsHelper(this.icoSphere.mesh, .1, 0xff0000, 1);


      this.scene.add(this.icoSphere.mesh);
      this.scene.add(this.icoSphere.layerEdgeLines);
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
    this.controls.minDistance = 2;
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

  onUpdateSlice(slice) {
    const sliceValue = mathUtils.convertToRange(slice, [0, 1], [-this.icoSphere.radius, this.icoSphere.radius]);
    this.ui.sliceValue = sliceValue;
    this.updateGeometry();
  }

  toggleOffsetVertices(value) {
    this.ui.offsetVertices = value;
    this.updateGeometry();
  }

  toggleProjection(value) {
    if (value !== this.ui.projectVert) {
      this.ui.projectVert = value;
      this.updateGeometry();
    }
  }

  viewMesh(visible) {
    this.ui.showMesh = visible;
    if (this.icoSphere.mesh) this.icoSphere.mesh.visible = this.ui.showMesh
  }

  viewLines(visible) {
    this.ui.showLines = visible;
    if (this.icoSphere.layerEdgeLines) {
      this.icoSphere.layerEdgeLines.visible = this.ui.showLines;
    }
  }

  viewNormals(visible) {
    this.ui.showNormals = visible;
    if (this.icoSphere.vertexNormals) this.icoSphere.vertexNormals.visible = this.ui.showNormals;
  }

  showGrid(visible) {
    if (visible) {
      const grid = new THREE.GridHelper(3, 15, 0x0000ff, 0x808080);
      grid.name = 'grid';
      this.scene.add(grid);
    } else {
      let _grid = this.scene.getObjectByName('grid');
      this.scene.remove(_grid);
      _grid = null;
    }
  }

  showAxis(visible) {
    if (visible) {
      const axisHelper = new THREE.AxesHelper(3);
      axisHelper.name = 'axisHelper';
      this.scene.add(axisHelper);
    } else {
      let _axisHelper = this.scene.getObjectByName('axisHelper');
      this.scene.remove(_axisHelper);
      _axisHelper = null;
    }
  }

  render() {
    return (
      <div>
        <div style={{overflow: 'hidden'}} className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}>
          <canvas ref={ref => this.canvas = ref}/>
        </div>
        <dg.GUI>
          <dg.Number label='Subdivision' value={this.icoSphere.level} min={1} max={6} step={1} onChange={this.onChangeLevel}/>
          <dg.Number label='Slice' value={this.ui.slice} min={0} max={1} step={.01} onChange={this.onUpdateSlice}/>
          <dg.Checkbox label='Offset-Vertices' checked={this.ui.offsetVertices} onFinishChange={this.toggleOffsetVertices}/>
          <dg.Checkbox label='projectVert' checked={this.ui.projectVert} onFinishChange={this.toggleProjection}/>
          <dg.Checkbox label='showMesh' checked={this.ui.showMesh} onFinishChange={this.viewMesh}/>
          <dg.Checkbox label='showLines' checked={this.ui.showLines} onFinishChange={this.viewLines}/>
          <dg.Checkbox label='showNormals' checked={this.ui.showNormals} onFinishChange={this.viewNormals}/>
          <dg.Checkbox label='showGrid' checked={this.ui.showGrid} onFinishChange={this.showGrid}/>
          <dg.Checkbox label='showAxis' checked={this.ui.showAxis} onFinishChange={this.showAxis}/>
        </dg.GUI>
        <a href={'/'}>
          <CloseIcon fill={'#ffffff'} className="close-icon"/>
        </a>
      </div>
    );
  }
}

export default IcoSphere;


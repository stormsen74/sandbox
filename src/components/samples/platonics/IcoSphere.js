import React from "react";
import * as THREE from "three";
import {Vector2, Vector3} from "three";
import {PolyhedronGeometry} from "../../../webgl/three/geometries/PolyhedronGeometry";
import OrbitControls from "../../../webgl/three/controls/OrbitControls";
import {PLATONIC_TYPE, types} from "./PlatonicTypes";

import CloseIcon from "../../../core/icons/close.inline.svg";
import "../Scene.scss";

import "react-dat-gui/build/react-dat-gui.css";

import * as dg from "dis-gui";
import mathUtils from "../../../utils/mathUtils";
import label_vert from "./glsl/label_vert.glsl";
import label_frag from "./glsl/label_frag.glsl";

const DEVELOPMENT = process.env.NODE_ENV === "development";
const radToDeg = angleRad => {
  return angleRad * 57.2958;
};
const VR_BG_COLOR = 0x363636;

const edgeColors = [
  new THREE.Color("#ac1719"),
  new THREE.Color("#4fb03d"),
  new THREE.Color("#e5672c"),
  new THREE.Color("#ffcc19"),

  new THREE.Color("#49afff"),
  new THREE.Color("#5e9fff"),
  new THREE.Color("#808cff"),
  new THREE.Color("#a574f3"),
  new THREE.Color("#c753dc")
];

const faceMaterials = [
  new THREE.MeshBasicMaterial({flatShading: true, visible: false, depthTest: true, color: "#ff0000", transparent: true, opacity: 0.01}),
  new THREE.MeshPhongMaterial({flatShading: true, color: "#dddddd", side: THREE.DoubleSide, transparent: true, opacity: 0.9}),
  new THREE.MeshPhongMaterial({flatShading: true, color: "#121ddd", side: THREE.DoubleSide, transparent: true, opacity: 0.7}),
  new THREE.MeshPhongMaterial({flatShading: true, color: "#15dd46", side: THREE.DoubleSide, transparent: true, opacity: 0.9})
];

class IcoSphere extends React.Component {
  constructor(props) {
    super(props);

    this.icoSphere = {
      type: PLATONIC_TYPE.ICOSAHEDRON,
      radius: 1,
      level: 1,
      mesh: null,
      vertices: [],
      hubs: [],
      struts: [],
      labels: [],
      strutTypes: [],
      layerHubs: new THREE.Object3D(),
      layerEdgeLines: new THREE.Object3D(),
      layerStruts: new THREE.Object3D(),
      layerLabels: new THREE.Object3D(),
      layerDebug: new THREE.Object3D(),
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
      showHubs: false,
      showStruts: false,
      showLines: true,
      showLabels: true,
      showNormals: false,
      showGrid: false,
      showAxis: false
    };
  }

  componentDidMount() {
    this.initThree();

    this.scene.add(this.icoSphere.layerEdgeLines);
    this.scene.add(this.icoSphere.layerHubs);
    this.scene.add(this.icoSphere.layerStruts);
    this.scene.add(this.icoSphere.layerLabels);
    this.scene.add(this.icoSphere.layerDebug);

    this.initIcoSphere(
      types[PLATONIC_TYPE.ICOSAHEDRON],
      this.icoSphere.radius,
      this.icoSphere.level,
      this.ui.projectVert
    );

    // ui
    this.initControls();
    this.showGrid(this.ui.showGrid);
    this.showAxis(this.ui.showAxis);

    window.addEventListener("resize", this.onResize, true);
    this.onResize();

    requestAnimationFrame(this.draw);
    TweenMax.to(this.canvasWrapper, 0.5, {
      delay: 0.5,
      opacity: 1,
      ease: Cubic.easeIn
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize, true);
  }

  initThree() {
    const options = {canvas: this.canvas, antialias: true};
    this.renderer = new THREE.WebGLRenderer(options);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VR_BG_COLOR);

    this.camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 0);

    let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    let lightTarget = new THREE.Object3D();
    let mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
    mainLight.position.set(0, 2, 0);
    mainLight.target = lightTarget;
    this.scene.add(lightTarget);
    this.scene.add(mainLight);
    this.scene.add(ambientLight);
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

    if (this.icoSphere.labels.length > 0) {
      this.clearLabels();
    }

    if (this.icoSphere.layerDebug.children.length > 0) {
      for (let i = 0; i < this.icoSphere.layerDebug.children.length; i++) {
        const child = this.icoSphere.layerDebug.children[i];
        child.material.dispose();
        this.icoSphere.layerDebug.remove(child);
      }

      this.scene.remove(this.icoSphere.layerDebug);
      this.icoSphere.layerDebug = null;
      this.icoSphere.layerDebug = new THREE.Object3D();
      this.scene.add(this.icoSphere.layerDebug);
    }

    if (this.icoSphere.hubs.length > 0 && this.icoSphere.struts.length > 0) {
      this.clearGeometryLayer();
    }

    if (this.icoSphere.vertexNormals != null) {
      this.scene.remove(this.icoSphere.vertexNormals);
      this.icoSphere.vertexNormals = null;
    }

    this.initIcoSphere(
      types[PLATONIC_TYPE.ICOSAHEDRON],
      this.icoSphere.radius,
      this.icoSphere.level,
      this.ui.projectVert
    );
  }

  creatIcoEdges(vertices, faces) {
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

      let del_ab = vertices[ab[0]]["_delete"] || vertices[ab[1]]["_delete"];
      let del_bc = vertices[bc[0]]["_delete"] || vertices[bc[1]]["_delete"];
      let del_ca = vertices[ca[0]]["_delete"] || vertices[ca[1]]["_delete"];

      let edge_ab = {
        start: vertices[ab[0]],
        end: vertices[ab[1]],
        length: parseFloat(length_ab.toFixed(5)),
        _indices: ab.toString(),
        _delete: del_ab
      };
      let edge_bc = {
        start: vertices[bc[0]],
        end: vertices[bc[1]],
        length: parseFloat(length_bc.toFixed(5)),
        _indices: bc.toString(),
        _delete: del_bc
      };
      let edge_ca = {
        start: vertices[ca[0]],
        end: vertices[ca[1]],
        length: parseFloat(length_ca.toFixed(5)),
        _indices: ca.toString(),
        _delete: del_ca
      };

      edges.push(edge_ab, edge_bc, edge_ca);
      indices.push(ab.toString(), bc.toString(), ca.toString());
    }

    // remove duplicate edges

    const getMatchingIndices = (sourceArray, value) => {
      for (let i = 0, iLen = sourceArray.length; i < iLen; i++) {
        if (sourceArray[i]["_indices"] === value) return sourceArray[i];
      }
    };

    const removeDuplicates = [...new Set(indices)];
    this.icoSphere.edges = [];
    for (let i = 0; i < removeDuplicates.length; i++) {
      let edge = getMatchingIndices(edges, removeDuplicates[i]);
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

  clearLabels() {
    for (let i = 0; i < this.icoSphere.labels.length; i++) {
      this.icoSphere.labels[i].material.dispose();
      this.icoSphere.layerLabels.remove(this.icoSphere.labels[i]);
    }
    this.icoSphere.labels = [];
  }

  createEdgeLines() {
    const edges = this.icoSphere.edges;

    let _edgeLengths = [];
    for (let i = 0; i < edges.length; i++) {
      _edgeLengths.push(edges[i].length);
    }
    // remove duplicates
    const edgeLengths = [...new Set(_edgeLengths)];

    const compareNumbers = (a, b) => {
      return a - b;
    };
    edgeLengths.sort(compareNumbers);
    console.log("create-edge-lines >", edgeLengths);

    this.icoSphere.strutTypes = [];
    const types = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    for (let i = 0; i < edgeLengths.length; i++) {
      this.icoSphere.strutTypes[i] = {
        type: types[i],
        length: edgeLengths[i],
        strutAngle: null,
        count: 0
      };
    }

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const material = new THREE.LineBasicMaterial();
      edgeLengths.forEach((l, index) => {
        if (edge.length === l) {
          material.color.set(edgeColors[index]);
          edge["_colorIndex"] = index;
        }
      });

      const edgeGeometry = new THREE.Geometry();
      if (!edge["_delete"]) {
        edgeGeometry.vertices.push(edge.start, edge.end);
        const edgeLine = new THREE.Line(edgeGeometry, material);
        this.icoSphere.edgeLines.push(edgeLine);
        this.icoSphere.layerEdgeLines.add(edgeLine);
        this.addStrut(edge);
      }
    }
  }

  addStrut(edge) {
    const path = new THREE.LineCurve3(edge.start, edge.end);
    const strutGeometry = new THREE.TubeGeometry(path, 1, 0.005, 5, false);
    const strutMaterial = new THREE.MeshPhongMaterial({
      color: edgeColors[edge["_colorIndex"]]
    });
    const strut = new THREE.Mesh(strutGeometry, strutMaterial);
    this.icoSphere.struts.push(strut);
    this.icoSphere.layerStruts.add(strut);
  }

  offsetVerticesForPrint(vertices) {
    for (let v = 0; v < vertices.length; v++) {
      let vert = vertices[v];
      // => offset = f(y)
      // vert.y = 0;

      const vxz = new Vector2(vert.x, vert.z);
      // const offset = mathUtils.convertToRange(vert.y, [-this.icoSphere.radius, this.icoSphere.radius], [0, 1]);
      const offset = this.icoSphere.radius - Math.abs(vert.y);
      vxz.multiplyScalar(offset);
      vert.add(new Vector3(vxz.x, 0, vxz.y));
    }
  }

  addHub(vertex) {
    const getHubColor = edgeCount => {
      let color = new THREE.Color();
      color.set("#ff07f2"); // unset
      if (edgeCount === 4) color.set("#12a306");
      if (edgeCount === 5) color.set("#06a2a3");
      if (edgeCount === 6) color.set("#a30000");
      return color;
    };

    const size = 0.025;
    const geometry = new THREE.CylinderGeometry(size, size, size);
    const material = new THREE.MeshPhongMaterial({
      color: getHubColor(vertex["_usedEdges"].length)
    });
    const hub = new THREE.Mesh(geometry, material);
    const upAxis = new THREE.Vector3(0, 1, 0);
    hub.quaternion.setFromUnitVectors(upAxis, vertex.clone().normalize());
    hub.position.set(vertex.x, vertex.y, vertex.z);
    this.icoSphere.hubs.push(hub);
    return hub;
  }

  clearGeometryLayer() {
    for (let i = 0; i < this.icoSphere.hubs.length; i++) {
      this.icoSphere.hubs[i].material.dispose();
      this.icoSphere.layerHubs.remove(this.icoSphere.hubs[i]);
    }
    this.icoSphere.hubs = [];

    for (let i = 0; i < this.icoSphere.struts.length; i++) {
      this.icoSphere.struts[i].material.dispose();
      this.icoSphere.layerStruts.remove(this.icoSphere.struts[i]);
    }
    this.icoSphere.struts = [];
  }

  setProjection(vertices, subdivision, radius, projectToSphere) {
    for (let v = 0; v < vertices.length; v++) {
      const vert = vertices[v];
      if (subdivision === 1) {
        vert.normalize().multiplyScalar(radius);
      } else {
        if (projectToSphere) {
          vert.normalize().multiplyScalar(radius);
        } else {
          vert.multiplyScalar(radius * 0.525);
        }
      }
    }
  }

  setIcoVerts(vertices) {
    // => ico-sphere vertices / slicing
    for (let v = 0; v < vertices.length; v++) {
      const vert = vertices[v];
      vert["_delete"] = vert.y <= this.ui.sliceValue;
      vert["_edges"] = [];
      vert["_faces"] = [];
      vert["_index"] = v;
      this.icoSphere.vertices.push(vert);
    }
  }

  addIcoEdges(vertices) {
    for (let v = 0; v < vertices.length; v++) {
      const vert = vertices[v];
      for (let i = 0; i < this.icoSphere.edges.length; i++) {
        const edge = this.icoSphere.edges[i];
        let indices = edge._indices.split(",");
        indices = indices.map(i => {
          return ~~i;
        });

        if (indices[0] === v || indices[1] === v) {
          vert["_edges"].push(edge);
        }
      }
    }
  }

  setFaceColors(faces, vertices) {
    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      let matIndex = 1;

      vertices.forEach(vertice => {
        if (vertice["_delete"] === true) {
          if (
            face.a === vertice["_index"] ||
            face.b === vertice["_index"] ||
            face.c === vertice["_index"]
          )
            face["_delete"] = true;
        }
        if (vertice["_edges"].length === 5 && vertice["_delete"] === false) {
          if (
            face.a === vertice["_index"] ||
            face.b === vertice["_index"] ||
            face.c === vertice["_index"]
          ) {
            matIndex = 2;
          }
        }
      });

      face.materialIndex = matIndex;
    }
  }

  getLabelTexture = index => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    ctx.font = "128px Consolas";
    ctx.textBaseline = "middle";
    const txt = index.toString();
    const lineWidth = 5;

    ctx.beginPath();
    ctx.arc(
      size * 0.5,
      size * 0.5,
      size * 0.5 - lineWidth,
      0,
      2 * Math.PI,
      false
    );
    ctx.fillStyle = "rgba(10,67,88,0.65)";
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#f1be2a";
    ctx.stroke();

    ctx.fillStyle = "rgb(233,231,224)";
    ctx.fillText(
      txt,
      size * 0.5 - ctx.measureText(txt).width * 0.5,
      size * 0.525
    );

    return canvas;
  };

  addHubLabel(vert) {
    // console.log(vert);
    const index = vert["_index"];
    const position = vert.clone();
    const offsetPosition = position.clone().multiplyScalar(1.1);
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute("position", new THREE.Float32BufferAttribute(offsetPosition.toArray(), 3));
    const texture = new THREE.CanvasTexture(this.getLabelTexture(index));
    let pointShader = new THREE.ShaderMaterial({
      uniforms: {
        texture: {type: "t", value: texture}
      },
      vertexShader: label_vert,
      fragmentShader: label_frag,
      depthTest: true,
      transparent: true
    });

    const lineMaterial = new THREE.LineBasicMaterial();
    lineMaterial.color.set("#a0f2ff");
    const lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(position, offsetPosition);
    const labelLine = new THREE.Line(lineGeometry, lineMaterial);
    let label = new THREE.Points(geometry, pointShader);

    this.icoSphere.labels.push(label);
    this.icoSphere.labels.push(labelLine);
    this.icoSphere.layerLabels.add(label);
    this.icoSphere.layerLabels.add(labelLine);
  }

  drawDebugLine(vStart, vEnd, color) {
    const lineMaterial = new THREE.LineBasicMaterial();
    const lineColor = color || "#000000";
    lineMaterial.color.set(lineColor);
    const lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(vStart, vEnd);
    const debugLine = new THREE.Line(lineGeometry, lineMaterial);
    this.icoSphere.layerDebug.add(debugLine);
  }

  addPointHelper(position) {
    const size = 0.025;
    const geometry = new THREE.SphereGeometry(size);
    const material = new THREE.MeshPhongMaterial({color: "#ff220a"});
    const point = new THREE.Mesh(geometry, material);
    point.position.set(position.x, position.y, position.z);
    this.icoSphere.layerDebug.add(point);
  }

  getMetrics(vertices, faces) {
    const _vertices = [];
    const _edges = [];
    const _faces = [];

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      if (face["_delete"]) {
        face.materialIndex = 0;
      } else {
        _faces.push(face);
      }
    }

    for (let i = 0; i < vertices.length; i++) {
      const vert = vertices[i];
      vert["_usedEdges"] = [];
      if (!vert["_delete"]) {
        vert["_edges"].forEach(edge => {
          this.icoSphere.strutTypes.forEach(strut => {
            if (edge.length === strut.length) edge["_type"] = strut.type;
          });
          if (!edge["_delete"]) vert["_usedEdges"].push(edge);
        });
        _vertices.push(vert);
        this.icoSphere.layerHubs.add(this.addHub(vert));
      }
    }

    // ADD FACES TO VERtEX
    const addFacesToVert = vert => {
      const index = vert["_index"];

      for (let j = 0; j < faces.length; j++) {
        const face = faces[j];
        if (index === face.a || index === face.b || index === face.c) {
          vert["_faces"].push(face);
        }
      }
    };

    const newAnglesAttempt = vert => {
      const center = new Vector3(0, 0, 0);
      const edge0 = vert._usedEdges[0];
      const edge1 = vert._usedEdges[1];

      const vNormal = vert.clone().normalize();
      const plane = new THREE.Plane(vNormal, -1);

      // vert._usedEdges.forEach((edge)=>{
      // // const vStart = edge.start._index === vert._index ? edge.start : edge.end;
      // const vEnd = edge.start._index !== vert._index ? edge.start : edge.end;
      // const ray = new THREE.Ray(center, vEnd);
      // const rayTarget = new Vector3();
      // ray.intersectPlane(plane, rayTarget);
      // this.addPointHelper(rayTarget);
      // const dir = rayTarget.clone().sub(vert);
      // // console.log(radToDeg(dir.angleTo(dir1)))
      //
      // });

      console.log("=>", "v:", vert, edge0, edge1);
      const e0start = edge0.start._index === vert._index ? edge0.start : edge0.end;
      const e0end = edge0.start._index !== vert._index ? edge0.start : edge0.end;
      const e1start = edge1.start._index === vert._index ? edge1.start : edge1.end;
      const e1end = edge1.start._index !== vert._index ? edge1.start : edge1.end;
      const planeHelper = new THREE.PlaneHelper(plane, 1);
      this.icoSphere.layerDebug.add(planeHelper);
      const ray0 = new THREE.Ray(center, e0end);
      const ray1 = new THREE.Ray(center, e1end);
      const rayTarget0 = new Vector3();
      const rayTarget1 = new Vector3();
      ray0.intersectPlane(plane, rayTarget0);
      ray1.intersectPlane(plane, rayTarget1);
      this.addPointHelper(rayTarget0);
      this.addPointHelper(rayTarget1);
      const dir0 = rayTarget0.clone().sub(vert);
      const dir1 = rayTarget1.clone().sub(vert);
      console.log(radToDeg(dir0.angleTo(dir1)));
    };

    const drawDebugEdge = vert => {
      const center = new Vector3(0, 0, 0);
      const edge0 = vert._usedEdges[0];
      const edge1 = vert._usedEdges[1];
      // console.log('=>', 'v:', vert, edge0, edge1);
      const e0start = edge0.start._index === edge0._index ? edge0.start : edge0.end;
      const e0end = edge0.start._index !== edge0._index ? edge0.start : edge0.end;
      const e1start = edge1.start._index === edge1._index ? edge1.start : edge1.end;
      const e1end = edge1.start._index !== edge1._index ? edge1.start : edge1.end;
      const vNormal = vert.clone().normalize();
      const edge0Dir = e0end.clone().sub(e0start.clone()).normalize();
      const edge1Dir = e1end.clone().sub(e1start.clone()).normalize();
      // console.log(radToDeg(edge0Dir.angleTo(edge1Dir)));
      // const edgeSpherical = new THREE.Spherical().setFromVector3(edgeDir);
      // edgeSpherical.set(edgeSpherical.radius, Math.PI * .5, edgeSpherical.theta)
      // const newEdgeDir = edgeDir.clone().setFromSpherical(edgeSpherical);
      // const rad = edgeDir.angleTo(newEdgeDir);
      // console.log(radToDeg(rad));
      this.drawDebugLine(center, vert.clone().multiplyScalar(1.25), "#3144ee");
      // this.drawDebugLine(vert, e0end, '#3144ee');
      // this.drawDebugLine(vert, e1end, '#57dc6a');

      const plane = new THREE.Plane(vNormal, -1);
      const projected_0 = new Vector3();
      const projected_1 = new Vector3();
      plane.projectPoint(e0end, projected_0);
      plane.projectPoint(e1end, projected_1);
      projected_0.add(e0end);
      projected_1.add(e1end);
      this.drawDebugLine(vert, projected_0, "#ca1ddc");
      this.drawDebugLine(vert, projected_1, "#ca1ddc");
      console.log("~", radToDeg(projected_0.angleTo(projected_1)));
      console.log("~", radToDeg(Math.acos(projected_0.clone().normalize().dot(projected_1.clone().normalize()))
        )
      );
      // console.log('~', radToDeg(Math.acos(projected_0.clone().normalize().dot(vNormal))));

      const vp0 = vert.distanceTo(projected_0);
      const vp1 = vert.distanceTo(projected_1);
      const p0p1 = projected_0.distanceTo(projected_1);

      // https://simplydifferently.org/Geodesic_Dome_Notes?page=2#Overview%20of%20Variants
      const ca = Math.acos((vp0 * vp0 + vp1 * vp1 - p0p1) / (2 * vp0 * vp1));
      console.log(vp0, vp1, p0p1, radToDeg(ca));

      // edge 0

      const logEdge = edge => {
        const radius = this.icoSphere.radius;
        const edgeLength = edge.length;
        const alpha = Math.asin(edgeLength / 2 / radius);
        const beta = Math.PI / 2 - alpha;
        const delta = Math.PI - 2 * beta;
        const chordFactor = 2 * Math.sin(delta / 2);
        console.log(
          "edge-indices: " +
          edge._indices +
          "\n" +
          "edge-type: " +
          edge._type +
          "\n" +
          "edge-length: " +
          edgeLength +
          "\n" +
          "alpha: " +
          radToDeg(alpha) +
          "\n" +
          "chord-factor: " +
          chordFactor +
          "\n"
        );
      };

      logEdge(edge0);
      logEdge(edge1);

      // this.drawDebugLine(edgeEnd, newDir.clone().add(v0), '#ff791d');
    };

    // ... ?
    Array.prototype.remove = function (from, to) {
      const rest = this.slice((to || from) + 1 || this.length);
      this.length = from < 0 ? this.length + from : from;
      return this.push.apply(this, rest);
    };

    const getZeroOrder = (face, vert) => {
      const order = [face.a, face.b, face.c];
      const zeroOrder = [];
      let startIndex;
      order.forEach(index => {
        index === vert._index ? (startIndex = index) : zeroOrder.push(index);
      });
      zeroOrder.unshift(startIndex);
      return zeroOrder;
    };

    const drawDebugFace = vert => {
      console.log(vert)
      // add zeroOrder / zero is at vertex 'for face angles
      vert._faces.forEach((face, index) => {
        face.zeroOrder = getZeroOrder(face, vert);
        face.materialIndex = 3;
      });

      const numFaces = vert._faces.length;
      let _vertFaces = [...vert._faces];
      _vertFaces.shift();
      const orderedFaces = [vert._faces[0]]; //
      let currentFace = orderedFaces[0];


      const isNextFace = face => {
        let commonVertices = 0;
        const currentIndices = [currentFace.a, currentFace.b, currentFace.c];
        const nextIndices = [face.a, face.b, face.c];
        let isNextFace = false;
        currentIndices.forEach(i => {
          const nextEdge = [];
          if (nextIndices.includes(i)) {
            nextEdge.push(i);
            commonVertices++;
          }
          if (commonVertices >= 2) isNextFace = true;
        });
        return isNextFace;
      };

      const orderFaces = () => {
        for (let i = 0; i < _vertFaces.length; i++) {
          const face = _vertFaces[i];
          if (isNextFace(face)) {
            orderedFaces.push(face);
            currentFace = face;
            _vertFaces.remove(i);
            break;
          }
        }
      };

      while (orderedFaces.length < numFaces) {
        orderFaces();
      }

      const getNextEdge = (e0, e1, n0, n1, firstFace = false) => {
        let nextEdge;
        if (e0 === e1 || e0 === n0 || e0 === n1) {
          nextEdge = e0;
        } else if (e1 === e0 || e1 === n0 || e1 === n1) {
          nextEdge = e1;
        }
        if (firstFace) nextEdge = nextEdge === e0 ? e1 : e0;
        return nextEdge;
      };

      let compareNumbers = (a, b) => {
        return a - b;
      };

      const getReferenzEdge = (orderedEdgeIndices) => {
        let referenzEdge = undefined;
        vert._usedEdges.forEach(edge => {
          const edgeIndices = edge._indices.split(',').map(parseFloat).sort(compareNumbers);
          if (orderedEdgeIndices[0] === edgeIndices[0] && orderedEdgeIndices[1] === edgeIndices[1]) referenzEdge = edge;
        });
        return referenzEdge;
      };

      const edgeOrder = [];
      for (let i = 0; i < orderedFaces.length; i++) {
        // compute angles direct here ... (per face)

        const face = orderedFaces[i];
        const edge0 = face.zeroOrder[0].toString() + ',' + face.zeroOrder[1].toString();
        const edge1 = face.zeroOrder[0].toString() + ',' + face.zeroOrder[2].toString();
        const nextFace = i < orderedFaces.length - 1 ? orderedFaces[i + 1] : null;
        if (nextFace) {
          const nextEdge0 = nextFace.zeroOrder[0].toString() + ',' + nextFace.zeroOrder[1].toString();
          const nextEdge1 = nextFace.zeroOrder[0].toString() + ',' + nextFace.zeroOrder[2].toString();
          if (i === 0) {
            edgeOrder.push(getNextEdge(edge0, edge1, nextEdge0, nextEdge1, true));
            edgeOrder.push(getNextEdge(edge0, edge1, nextEdge0, nextEdge1));
          } else {
            edgeOrder.push(getNextEdge(edge0, edge1, nextEdge0, nextEdge1));
          }
        }
      }

      console.log('edgeOrder: ', edgeOrder);

      // get real Referenz edge ...
      const orderedEdgeIndices = edgeOrder[0].split(',').map(parseFloat).sort(compareNumbers);
        console.log('referenzEdge: ', getReferenzEdge(orderedEdgeIndices));


      // Todo get edgeReferenz by edge

      // console.log("ordered: ", orderedFaces);

      // TODO -update material index / sort winding (next edge) => get angles here


      // console.log(face, order, nOrder);
    };

    // const t1 = (0.34862 * 0.34862) + (0.34862 * 0.34862) - (0.40355 * 0.40355);
    // const t2 = 2 * 0.34862 * 0.34862;
    // const a = Math.acos(t1 / t2) * 57.2958;
    // console.log(a);

    // ADD LABELS
    for (let i = 0; i < _vertices.length; i++) {
      const vert = _vertices[i];
      this.addHubLabel(vert);

      addFacesToVert(vert);
      // if (vert._index === 33) drawDebugEdge(vert)
      if (vert._index === 11) drawDebugFace(vert);
      // if (vert._index === 26) newAnglesAttempt(vert);
    }

    this.icoSphere.edges.forEach(edge => {
      if (!edge["_delete"]) _edges.push(edge);
    });

    const getStrutAngle = edge => {
      let indices = edge._indices.split(",");
      const vertex = vertices[~~indices[0]];
      const end = edge.end.clone();
      const start = edge.start.clone();
      const edgeDirection = end.sub(start).normalize();
      const vNormalized = vertex.clone().normalize();
      const dotProduct = vNormalized.dot(edgeDirection);
      const angle = Math.acos(dotProduct);
      return Math.abs(angle * 57.2958 - 90).toFixed(2);
    };

    this.icoSphere.strutTypes.forEach((s, i) => {
      _edges.forEach(edge => {
        if (edge._type === s.type) {
          if (s.count === 0) s.strutAngle = getStrutAngle(edge);
          s.count++;
        }
      });
    });

    // Todo - getHubAngles _\|/_ / getHubTypes / radius - scaling /
    // https://simplydifferently.org/Geodesic_Dome_Notes?page=3#2V%20Icosahedron%20Dome
    // https://simplydifferently.org/Geodesic_Dome_Notes?page=2#Overview%20of%20Variants
    // http://www.neolithicsphere.com/geodesica/doc/isolate_vertex.html

    // console.log('v >', _vertices);
    // console.log('f >', _faces);
    // console.log('e >', _edges);

    console.log("=== METRICS ===");
    console.log("HUBS (VERTICES): ", _vertices.length);
    console.log("STRUTS: ", _edges.length);
    this.icoSphere.strutTypes.forEach((s, i) => {
      console.log("|" + s.type + "| × " + s.count + " | strutLength: " + s.length + " | strutAngle: " + s.strutAngle + "°");
    });
    console.log("FACES: ", _faces.length);
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
      platonic_geometry.elementsNeedUpdate = true;
      platonic_geometry.groupsNeedUpdate = true;
      const faces = platonic_geometry.faces;
      const vertices = platonic_geometry.vertices;

      this.setProjection(vertices, subdivision, radius, projectToSphere);

      this.setIcoVerts(vertices);

      this.creatIcoEdges(vertices, faces);

      this.createEdgeLines();

      this.addIcoEdges(vertices);

      this.setFaceColors(faces, vertices);

      if (this.ui.offsetVertices) this.offsetVerticesForPrint(vertices);

      // console.log(vertices);
      // console.log(faces);

      // TODO => generate new Geometry // add statistics

      this.getMetrics(vertices, faces);

      // 2. => to buffer
      const platonic_buffer_geometry = new THREE.BufferGeometry().fromGeometry(platonic_geometry);

      this.icoSphere.mesh = new THREE.Mesh(platonic_buffer_geometry, faceMaterials);
      this.icoSphere.vertexNormals = new THREE.VertexNormalsHelper(this.icoSphere.mesh, 0.1, 0xff0000, 1);

      this.scene.add(this.icoSphere.mesh);
      this.scene.add(this.icoSphere.vertexNormals);

      this.icoSphere.vertexNormals.visible = this.ui.showNormals;
      this.icoSphere.mesh.visible = this.ui.showMesh;
      this.icoSphere.layerEdgeLines.visible = this.ui.showLines;
      this.icoSphere.layerHubs.visible = this.ui.showHubs;
      this.icoSphere.layerStruts.visible = this.ui.showStruts;
    }
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.dampingFactor = 0.15;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 7;
    // this.controls.maxPolarAngle = Math.PI / 2;
  }

  update() {
    this.controls.update();
  }

  onResize = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  draw = () => {
    requestAnimationFrame(this.draw);
    this.update();
    this.renderer.render(this.scene, this.camera);
  };

  // UI - UPDATES

  onChangeRadius = () => {
    console.log("R", this.icoSphere.radius);
  };

  onChangeLevel = level => {
    if (level !== this.icoSphere.level) {
      this.icoSphere.level = level;
      this.updateGeometry();
    }
  };

  onUpdateSlice = slice => {
    const sliceValue = mathUtils.convertToRange(slice, [0, 1], [-this.icoSphere.radius, this.icoSphere.radius]);
    this.ui.sliceValue = sliceValue;
    this.updateGeometry();
  };

  toggleOffsetVertices = value => {
    this.ui.offsetVertices = value;
    this.updateGeometry();
  };

  toggleProjection = value => {
    if (value !== this.ui.projectVert) {
      this.ui.projectVert = value;
      this.updateGeometry();
    }
  };

  viewMesh = visible => {
    this.ui.showMesh = visible;
    if (this.icoSphere.mesh) this.icoSphere.mesh.visible = this.ui.showMesh;
  };

  viewLines = visible => {
    this.ui.showLines = visible;
    if (this.icoSphere.layerEdgeLines) {
      this.icoSphere.layerEdgeLines.visible = this.ui.showLines;
    }
  };

  viewLabels = visible => {
    this.ui.showLabels = visible;
    if (this.icoSphere.layerLabels) {
      this.icoSphere.layerLabels.visible = this.ui.showLabels;
    }
  };

  viewNormals = visible => {
    this.ui.showNormals = visible;
    if (this.icoSphere.vertexNormals)
      this.icoSphere.vertexNormals.visible = this.ui.showNormals;
  };

  viewHubs = visible => {
    this.ui.showHubs = visible;
    if (this.icoSphere.layerHubs) {
      this.icoSphere.layerHubs.visible = this.ui.showHubs;
    }
  };

  viewStruts = visible => {
    this.ui.showStruts = visible;
    if (this.icoSphere.layerStruts) {
      this.icoSphere.layerStruts.visible = this.ui.showStruts;
    }
  };

  showGrid = visible => {
    if (visible) {
      const grid = new THREE.GridHelper(2, 2, 0x0000ff, 0x808080);
      grid.name = "grid";
      this.scene.add(grid);
    } else {
      let _grid = this.scene.getObjectByName("grid");
      this.scene.remove(_grid);
      _grid = null;
    }
  };

  showAxis = visible => {
    if (visible) {
      const axisHelper = new THREE.AxesHelper(1.5);
      axisHelper.name = "axisHelper";
      this.scene.add(axisHelper);
    } else {
      let _axisHelper = this.scene.getObjectByName("axisHelper");
      this.scene.remove(_axisHelper);
      _axisHelper = null;
    }
  };

  render() {
    return (
      <div>
        <div style={{overflow: "hidden"}} className={"canvas-wrapper"} id={"canvas-wrapper"} ref={ref => (this.canvasWrapper = ref)}>
          <canvas ref={ref => (this.canvas = ref)}/>
        </div>
        <dg.GUI>
          <dg.Number label="Radius" value={this.icoSphere.radius} min={1} max={6} step={0.1} onChange={this.onChangeRadius}/>
          <dg.Number label="Subdivision" value={this.icoSphere.level} min={1} max={6} step={1} onChange={this.onChangeLevel}/>
          <dg.Number label="Slice" value={this.ui.slice} min={0} max={1} step={0.01} onChange={this.onUpdateSlice}/>
          <dg.Checkbox label="Offset-Vertices" checked={this.ui.offsetVertices} onFinishChange={this.toggleOffsetVertices}/>
          <dg.Checkbox label="projectVert" checked={this.ui.projectVert} onFinishChange={this.toggleProjection}/>
          <dg.Checkbox label="showMesh" checked={this.ui.showMesh} onFinishChange={this.viewMesh}/>
          <dg.Checkbox label="showLines" checked={this.ui.showLines} onFinishChange={this.viewLines}/>
          <dg.Checkbox label="showLabels" checked={this.ui.showLabels} onFinishChange={this.viewLabels}/>
          <dg.Checkbox label="showNormals" checked={this.ui.showNormals} onFinishChange={this.viewNormals}/>
          <dg.Checkbox label="showHubs" checked={this.ui.showHubs} onFinishChange={this.viewHubs}/>
          <dg.Checkbox label="showStruts" checked={this.ui.showStruts} onFinishChange={this.viewStruts}/>
          <dg.Checkbox label="showGrid" checked={this.ui.showGrid} onFinishChange={this.showGrid}/>
          <dg.Checkbox label="showAxis" checked={this.ui.showAxis} onFinishChange={this.showAxis}/>
        </dg.GUI>
        <a href={"/"}>
          <CloseIcon fill={"#ffffff"} className="close-icon"/>
        </a>
      </div>
    );
  }
}

export default IcoSphere;

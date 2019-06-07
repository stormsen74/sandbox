import React from 'react';
import connect from "react-redux/es/connect/connect";
import 'gsap/TweenMax';
import 'gsap/TimelineMax';
import 'react-dat-gui/build/react-dat-gui.css';
import DatGui, {DatButton, DatNumber} from 'react-dat-gui';
import * as PIXI from 'pixi.js'
import CloseIcon from 'core/icons/close.inline.svg';
import '../Scene.scss'
import {Vector2} from "../../../utils/vector2";
import moment from 'moment';


import DrawUtils from "../../../utils/DrawUtils";
import CatmullSpline from "../../../utils/catmull-rom/CatmullSpline";
import mathUtils from "../../../utils/mathUtils";
import axios from "axios";


const DEVELOPMENT = process.env.NODE_ENV === 'development';

class TidesVisualizer extends React.Component {

  state = {
    data: {
      package: 'react-dat-gui',
      progress: .5,
      showPath: true,
      showBounds: true,
      feelsLike: '#2FA1D6'
    }
  };

  update = data => this.updateData(data);

  constructor(props) {
    super(props);

    // this.loadReady = this.loadReady.bind(this);
    this.getTides = this.getTides.bind(this);
    this.playTides = this.playTides.bind(this);
    this.stopTides = this.stopTides.bind(this);


    this.plot = {
      width: 1500,
      height: 600,
      stepX: 0
    };


    // https://www.pegelonline.wsv.de/webservice/ueberblick
    // https://www.pegelonline.wsv.de/webservices/zeitreihe/visualisierung?pegelnummer=5952050

    let today = moment({hour: 0}).add(1, 'hour').format(); // add 1 hour => utc+1
    let yesterday = moment(today).subtract(1, 'day'); // yesterday is valid [https://www.pegelonline.wsv.de/webservice/dokuAkt]
    // let timeStart = moment(yesterday).format();
    // let timeEnd = moment(yesterday).add(1, 'day').format();

    let timeStart = moment(yesterday).toISOString();
    let timeEnd = moment(yesterday).add(1, 'day').toISOString();

    this.tides = {
      extremes: [],
      date: today,
      timeStart: timeStart,
      timeEnd: timeEnd,
      range: []
    };
    console.log(this.tides)

    this.vstart = new Vector2(0, this.plot.height * .75);
    this.previousPlotPosition = new Vector2();
    this.time = {t: 0}


  }

  componentDidMount() {

    this.initStage();
    this.getTides(this);
    this.show();

  }

  initStage() {
    this.app = new PIXI.Application({
        width: this.plot.width + 100,
        height: this.plot.height,
        antialias: true,    // default: false
        transparent: false, // default: false
        resolution: 1       // default: 1
      }
    );

    this.app.view.id = 'pixi-app-view';
    this.canvasWrapper.appendChild(this.app.view);

    this.gfx = new PIXI.Container();
    this.controlLayer = new PIXI.Container();
    this.gridLayer = new PIXI.Container();
    this.pointerLayer = new PIXI.Container();
    this.waterLayer = new PIXI.Container();
    this.flowLayer = new PIXI.Container();
    this.app.stage.addChild(this.gridLayer);
    this.app.stage.addChild(this.gfx);
    this.app.stage.addChild(this.controlLayer);
    this.app.stage.addChild(this.pointerLayer);
    this.app.stage.addChild(this.waterLayer);
    this.app.stage.addChild(this.flowLayer);

    this.dateDisplay = new PIXI.Text(this.tides.date, {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    this.dateDisplay.x = 10;
    this.dateDisplay.y = 550;
    this.gridLayer.addChild(this.dateDisplay);

    this.timeDisplay = new PIXI.Text('0', {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    this.timeDisplay.x = 510;
    this.timeDisplay.y = 10;
    this.gridLayer.addChild(this.timeDisplay);

    this.levelDisplay = new PIXI.Text('0 m', {fontFamily: 'Arial', fontSize: 15, fill: 0xffffff, align: 'center'});
    this.levelDisplay.x = 1500 - 30;
    this.levelDisplay.y = this.vstart.y + 110;
    this.gridLayer.addChild(this.levelDisplay);

    this.pointer = new PIXI.Graphics();
    this.pointer.beginFill(0x00ff00);
    this.pointer.drawCircle(0, 0, 3);
    this.pointer.endFill();
    this.pointer.x = 0;
    this.pointer.y = 0;
    this.pointerLayer.addChild(this.pointer);
  }

  show() {
    TweenMax.to(this.canvasWrapper, .5, {delay: .25, opacity: 1, ease: Cubic.easeIn});
  }

  getTides(_this) {

    // const url = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/HAMBURG ST. PAULI/W/measurements.json?start=2018-10-28T23:00&end=2018-10-30T01:00';
    const url = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/HAMBURG ST. PAULI/W/measurements.json?start=' + _this.tides.timeStart + '&end=' + _this.tides.timeEnd;
    axios.get(url, {
      responseType: 'json',
      headers: {
        'accept': 'application/json',
        // 'Authorization': 'f780dfde-e181-4c1d-a246-fe9fbd80274c'
      },
    }).then(function (response) {
      _this.initCurve(response.data);
    }).catch(function (error) {
      // handle error
      console.log(error);
    }).then(function () {
      // if error debug!
    });
  }


  getValleysAndPeaks(values) {
    let peakIndexes = [];
    let valleyIndexes = []

    let directionUp = values[0] <= values[1];

    for (let i = 1; i < values.length - 1; i++) {
      if (directionUp && values[i + 1] < values[i]) {
        peakIndexes.push({index: i, values: values[i]});
        directionUp = false;
      }
      else if (!directionUp && values[i + 1] > values[i]) {
        valleyIndexes.push({index: i, values: values[i]});
        directionUp = true;
      }
    }

    console.log(peakIndexes, valleyIndexes)
  }

  initCurve(data) {

    this.ctrlPoints = [];
    this.plot.stepX = 1500 / data.length;

    let values = [];
    for (let i = 0; i < data.length; i += 30) {
      let x = this.vstart.x - (this.plot.stepX * 60) + (this.plot.stepX * i);
      let y = this.vstart.y + 400 - (data[i].value);
      this.ctrlPoints.push([x, y]);
      values.push(data[i].value)
    }
    this.getValleysAndPeaks(values);

    this.spline = new CatmullSpline(this.ctrlPoints);

    this.plotGrid();
    this.renderSpline();
    this.renderControlPoints();
    this.tides.range = this.getRange()
  }

  plotGrid() {
    const rangeWidth = 1500 - (this.plot.stepX * 120);
    const rangeQuarter = rangeWidth / 4;
    DrawUtils.plotLine(this.gridLayer, this.vstart, new Vector2(this.vstart.x + this.plot.width, this.vstart.y), 0xccccff, 1)
    DrawUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + rangeWidth, 0), new Vector2(rangeWidth, this.vstart.y + 600), 0xccccff, 1);
    DrawUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + rangeQuarter, 0), new Vector2(this.vstart.x + rangeQuarter, this.vstart.y + 600), 0x00ff00, .5);
    DrawUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + rangeQuarter * 2, 0), new Vector2(this.vstart.x + rangeQuarter * 2, this.vstart.y + 600), 0x00ff00, .5);
    DrawUtils.plotLine(this.gridLayer, new Vector2(this.vstart.x + rangeQuarter * 3, 0), new Vector2(this.vstart.x + rangeQuarter * 3, this.vstart.y + 600), 0x00ff00, .5)
  }

  renderSpline() {
    let t = 0;
    let previousPosition = new Vector2();
    while (t < this.ctrlPoints.length - 3) {
      let splinePoint = this.spline.evaluate(t);
      if (previousPosition.length() > 0) {
        const currentPosition = new Vector2(splinePoint[0], splinePoint[1]);
        DrawUtils.plotLine(this.gfx, previousPosition, currentPosition, 0xffffff, 1);
      }
      previousPosition = new Vector2(splinePoint[0], splinePoint[1]);
      t += .01;
    }
  }

  renderControlPoints() {
    for (let i = 0; i < this.ctrlPoints.length; i++) {
      DrawUtils.plotPoint(this.controlLayer, new Vector2(this.ctrlPoints[i][0], this.ctrlPoints[i][1]), 0xff0000, 3)
    }
  }

  getRange() {
    let t = 0;
    let progress = 0;
    let pos = [];
    let range = [];
    while (t < 1) {
      t += .001;
      progress = t * (this.ctrlPoints.length - 3);
      pos = this.spline.evaluate(progress);
      if (Math.floor(pos[0]) == 0) range[0] = progress;
      if (Math.floor(pos[0]) == Math.round(1500 - (this.plot.stepX * 120))) range[1] = progress;
    }
    return range;
  }


  playTides() {
    this.time.t = 0;

    TweenMax.to(this.time, 60, {
      t: 1,
      ease: Linear.easeNone,
      onUpdate: () => {
        this.plotTime(this.time.t);
        this.setState({
          data: {
            ...this.state.data,
            progress: this.time.t
          }
        })
      },
      onUpdateScope: this,
      onComplete: () => {
        this.previousPlotPosition = new Vector2();
        this.playTides();
      },
      onCompleteScope: this
    })
  }

  stopTides() {
    TweenMax.killTweensOf(this.time);
  }


  plotTime(value) {
    const progress = value * (this.ctrlPoints.length - 3);
    const mappedProgress = mathUtils.convertToRange(progress, [0, this.ctrlPoints.length - 3], [this.tides.range[0], this.tides.range[1]]);
    const pos = this.spline.evaluate(mappedProgress);
    const currentPosition = new Vector2(pos[0], pos[1]);
    if (this.previousPlotPosition.length() > 0) {
      const tangent = Vector2.subtract(currentPosition, this.previousPlotPosition).normalize();
      const tangentRAD = Vector2.getAngleRAD(tangent);

      if (this.flowLayer.children.length > 0) this.flowLayer.removeChildAt(0);
      const start = new Vector2(750, 500);
      const end = start.clone();
      end.add(new Vector2(tangentRAD * 100, 0))

      DrawUtils.plotLine(this.flowLayer, start, end, tangentRAD > 0 ? 0xea2323 : 0x36ceed, 5 * Math.abs(tangentRAD))
    }
    this.previousPlotPosition = currentPosition.clone();

    this.pointer.x = currentPosition.x;
    this.pointer.y = currentPosition.y;

    if (this.waterLayer.children.length > 0) this.waterLayer.removeChildAt(0);
    const waterLevel = (this.vstart.y + 400 - this.pointer.y) / 100;
    this.levelDisplay.text = waterLevel.toFixed(2) + ' m';
    let level = new PIXI.Graphics();
    level.beginFill(0x3578ea);
    level.drawRect(0, 0, 50, -waterLevel * 50);
    level.endFill();
    level.x = 1500 - 30;
    level.y = this.vstart.y + 100;
    this.waterLayer.addChild(level);


    const time = Math.round(mathUtils.convertToRange(value, [0, 1], [0, 24 * 60 * 60]));
    const minutes = time / 60;
    const hours = Math.floor(time / 3600);
    this.timeDisplay.text = hours + ' : ' + Math.round(minutes % 60);
  }

  updateData(data) {
    this.stopTides();
    this.setState({data});
    this.plotTime(data.progress);
  }

  render() {
    const {data} = this.state;
    if (this.pathLayer) this.pathLayer.visible = data.showPath;
    if (this.boundsLayer) this.boundsLayer.visible = data.showBounds;

    return (
      <div className={'wrapper'}>
        <div className={'canvas-wrapper'} id={'canvas-wrapper'} ref={ref => this.canvasWrapper = ref}></div>
        <DatGui data={data} onUpdate={this.update}>
          <DatNumber path='progress' label='progress' min={0} max={1} step={0.001}/>
          <DatButton label="Play" onClick={this.playTides}/>
          <DatButton label="Stop" onClick={this.stopTides}/>
          {/*<DatButton label="Pause" onClick={this.pauseTimeline}/>*/}
          {/*<DatBoolean path='showPath' label='showPath'/>*/}
          {/*<DatBoolean path='showBounds' label='showBounds'/>*/}
        </DatGui>
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

export default connect(mapStateToProps, {})(TidesVisualizer);


import React from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {hot} from 'react-hot-loader';
import IndexPage from 'pages/IndexPage';
import NotFoundPage from 'pages/NotFoundPage';
import Cube from "../components/samples/cube/Cube";
import TidesVisualizer from "../components/samples/tides-visualizer/TidesVisualizer";
import Platonics from "../components/samples/platonics/Platonics";

class IndexRoutes extends React.Component {
  constructor(props) {
    super(props);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('index');
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={IndexPage}/>
          <Route path="/cube" component={Cube}/>
          <Route path="/tides-visualizer" component={TidesVisualizer}/>
          <Route path="/platonics" component={Platonics}/>
          <Route component={NotFoundPage}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default hot(module)(IndexRoutes);

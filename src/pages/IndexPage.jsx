import React from 'react';
import {connect} from 'react-redux';
import PreviewIcon from "../components/previewIconComponent/PreviewIconComponent";
import {samples} from "../components/samples/config";

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    const body = document.getElementsByTagName('body')[0];
    body.classList.add('index');
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {

    const sampleList = samples.map((item, index) =>
      <PreviewIcon history={this.props.history} title={item.title} route={item.route} key={index}/>
    );

    return (
      <section>
        <div>
          <h2 style={{margin: '5px'}}>Sandbox</h2>
          {sampleList}
        </div>
      </section>
    );
  }
}


function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {})(IndexPage);


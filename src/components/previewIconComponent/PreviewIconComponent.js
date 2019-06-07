import React from 'react';
import {connect} from 'react-redux';

import './PrieviewIconComponent.scss';

class PreviewIcon extends React.Component {

  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick = (e) => {
    this.props.history.push(this.props.route)
  };


  render() {
    const {title} = this.props;

    let pop = (
      <div className={'pop'} onClick={this.handleClick}>
        <div className={'title'}>{title}</div>
      </div>
    );

    return (
      <React.Fragment>
        {pop}
      </React.Fragment>
    );
  }

}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps, {})(PreviewIcon);

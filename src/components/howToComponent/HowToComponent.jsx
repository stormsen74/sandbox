// React & Redux related imports
import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

// Test action
import {aTestAction, anotherTestAction} from 'actions/testActions';

// svg as React.Component
import NavIcon from 'core/icons/navi.inline.svg';

// Styling
import './HowToComponent.scss';

// Image
import logo from './img.jpg';


class HowToComponent extends React.Component {
  static randomGreeting() {
    const greetings = [
      'Moin, moin.',
      'Hi, na?',
      'Hey!',
      'Sers!',
      'Aloha!',
    ];
    const randomInt = Math.floor(Math.random() * 5) + 1;
    return greetings[randomInt - 1];
  }

  constructor() {
    super();
    this.state = {
      isVisible: false,
    };
    this.onClickTest = this.onClickTest.bind(this);
  }

  componentDidUpdate() {
    if (!this.state.isVisible) {
      this.props.anotherTestAction();
      this.updateVisibility();
    }
  }

  onClickTest() {
    const bool = !this.props.someState;
    this.props.aTestAction(bool);
  }

  updateVisibility() {
    this.setState({
      isVisible: true,
    });
  }

  render() {
    const {someState} = this.props;
    const {isVisible} = this.state;

    const classNames = someState ? 'how-to-component how-to-component--active' : 'how-to-component';
    const randomHeadlingCopy = HowToComponent.randomGreeting();
    const fillColor = '#ff00e7';

    return (
      <React.Fragment>
        <img src={logo} alt="Logo"/>
        <div>HowTo...</div>
        <div>
          <p>inline svg as React.Component:</p>
          <NavIcon width={76} height={76} fill={fillColor} className="how-to-component__icon"/>
        </div>
        <div className={classNames}>
          <h2 className="how-to-component__headline">{isVisible && randomHeadlingCopy}</h2>
          <button onClick={this.onClickTest}>Update headline copy, please!</button>
        </div>
      </React.Fragment>
    );
  }
}

// props validation
HowToComponent.propTypes = {
  aTestAction: PropTypes.func.isRequired,
  anotherTestAction: PropTypes.func.isRequired,
  someState: PropTypes.bool.isRequired,
};

// Redux connection
function mapStateToProps(state) {
  return {
    someState: state.test.testValue,
  };
}

// class export
export default connect(mapStateToProps, {
  aTestAction,
  anotherTestAction,
})(HowToComponent);

/**
 * @see https://reactjs.org/docs/error-boundaries.html
 * recovers from error if webpack hash changes
 */
import React from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      hash: window.__webpack_hash__,
      errorInfo: null,
    };
  }

  componentDidUpdate() {
    if (this.state.hash !== window.__webpack_hash__) {
      this.onUpdate();
    }
  }

  componentDidCatch(error, info) {
    this.setState({
      hasError: true,
      errorInfo: info,
    });
  }

  onUpdate() {
    this.setState({
      hasError: false,
      hash: window.__webpack_hash__,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <React.Fragment>
          <h1>Error Boundary</h1>
          <ul>
            {
              this.state.errorInfo.componentStack.split('\n').filter(element => element.length > 0).map(element => (
                <li key={element.id}>{element}</li>))
            }
          </ul>
        </React.Fragment>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.element.isRequired,
};

export default ErrorBoundary;

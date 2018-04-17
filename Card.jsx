import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import * as css from './style/Card.scss';

export default class Card extends React.Component {
  static defaultProps = {
    classes: [],
    faceUp: null,
    zIndex: null,
  }

  static propTypes = {
    classes: PropTypes.arrayOf(PropTypes.string),
    deckType: PropTypes.string.isRequired,
    faceUp: PropTypes.bool,
    renderFront: PropTypes.func.isRequired,
    renderBack: PropTypes.func.isRequired,
    zIndex: PropTypes.number,
  }

  state = {
    faceUp: false,
    classes: new Set(),
    zIndex: null,
  }

  set_depth(z) {
    this.setState({ zIndex: z });
  }

  flip_up(faceUp) {
    this.setState({ faceUp });
  }

  push_down() {
    this.setState(({ zIndex }) => ({ zIndex: zIndex - 1 }));
  }

  addClass(class_name) {
    this.setState(({ classes }) => {
      const newClasses = new Set(classes);
      newClasses.add(class_name);
      return { classes: newClasses };
    });
  }

  removeClass(class_name) {
    this.setState(({ classes }) => {
      const newClasses = new Set(classes);
      newClasses.delete(class_name);
      return { classes: newClasses };
    });
  }

  render() {
    const baseClasses = classNames(
      [...this.state.classes],
      [...this.props.classes],
      css.card,
      css[this.props.deckType],
    );
    const faceUp = (this.props.faceUp !== null) ? this.props.faceUp : this.state.faceUp;
    const backClasses = classNames(baseClasses, css.back, faceUp ? css.down : css.up);
    const frontClasses = classNames(baseClasses, css.front, faceUp ? css.up : css.down);

    const zIndex = (this.props.zIndex !== null) ? this.props.zIndex : this.state.zIndex;
    const style = { zIndex };

    return (
      <React.Fragment>
        <div className={backClasses} style={style}>
          {this.props.renderBack()}
        </div>
        <div className={frontClasses} style={style}>
          {this.props.renderFront()}
        </div>
      </React.Fragment>
    );
  }
}

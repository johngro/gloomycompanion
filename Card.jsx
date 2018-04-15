import PropTypes from 'prop-types';
import React from 'react';

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
    const backClasses = new Set([...this.state.classes, ...this.props.classes]);
    backClasses.add('card');
    backClasses.add(this.props.deckType);

    const frontClasses = new Set(backClasses);
    const faceUp = (this.props.faceUp !== null) ? this.props.faceUp : this.state.faceUp;
    frontClasses.add('front');
    frontClasses.add(faceUp ? 'up' : 'down');
    backClasses.add('back');
    backClasses.add(faceUp ? 'down' : 'up');

    const zIndex = (this.props.zIndex !== null) ? this.props.zIndex : this.state.zIndex;
    const style = { zIndex };

    return (
      <React.Fragment>
        <div className={[...backClasses].join(' ')} style={style}>
          {this.props.renderBack()}
        </div>
        <div className={[...frontClasses].join(' ')} style={style}>
          {this.props.renderFront()}
        </div>
      </React.Fragment>
    );
  }
}

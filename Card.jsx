import PropTypes from 'prop-types';
import React from 'react';

export default class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      faceUp: false,
      classes: new Set(),
      zIndex: null,
    };
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
    const backClasses = new Set(this.state.classes);
    backClasses.add('card');
    backClasses.add(this.props.deckType);

    const frontClasses = new Set(backClasses);
    frontClasses.add('front');
    frontClasses.add(this.state.faceUp ? 'up' : 'down');
    backClasses.add('back');
    backClasses.add(this.state.faceUp ? 'down' : 'up');

    const style = { zIndex: this.state.zIndex };

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

Card.propTypes = {
  deckType: PropTypes.string.isRequired,
  renderFront: PropTypes.func.isRequired,
  renderBack: PropTypes.func.isRequired,
};

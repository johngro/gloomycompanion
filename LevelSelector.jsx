import PropTypes from 'prop-types';
import React from 'react';

const MAX_LEVEL = 7;

export default class LevelSelector extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  get_selection() {
    const currentValue = this.inputRef.current.value;
    return (currentValue > MAX_LEVEL) ? MAX_LEVEL : currentValue;
  }

  set_value(value) {
    this.inputRef.current.value = (value > MAX_LEVEL) ? MAX_LEVEL : value;
  }

  render() {
    const Wrapper = this.props.inline ? 'span' : 'ul';
    const Label = this.props.inline ? 'label' : 'li';

    return (
      <Wrapper className="selectionlist">
        <Label>{this.props.text}</Label>
        <input
          defaultValue="1"
          max={MAX_LEVEL.toString()}
          min="0"
          name="scenario_number"
          type="number"
          ref={this.inputRef}
        />
      </Wrapper>
    );
  }
}

LevelSelector.propTypes = {
  inline: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
};

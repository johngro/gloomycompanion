import PropTypes from 'prop-types';
import React from 'react';

const MAX_LEVEL = 7;

export default function LevelSelector(props) {
  const Wrapper = props.inline ? 'span' : 'ul';
  const Label = props.inline ? 'label' : 'li';

  const onChange = (event) => {
    const value = parseInt(event.target.value);
    props.onChange((value > MAX_LEVEL) ? MAX_LEVEL : value);
  };
  return (
    <Wrapper className="selectionlist">
      <Label>{props.text}</Label>
      <input
        max={MAX_LEVEL.toString()}
        min="0"
        name="scenario_number"
        type="number"
        value={props.value}
        onChange={onChange}
      />
    </Wrapper>
  );
}

LevelSelector.propTypes = {
  inline: PropTypes.bool.isRequired,
  text: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

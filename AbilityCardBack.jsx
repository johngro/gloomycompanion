import PropTypes from 'prop-types';
import React from 'react';

export default function AbilityCardBack(props) {
  return <span className="name">{props.name}-{props.level}</span>;
}

AbilityCardBack.propTypes = {
  name: PropTypes.string.isRequired,
  level: PropTypes.string.isRequired,
};

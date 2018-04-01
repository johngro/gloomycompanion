import PropTypes from 'prop-types';
import React from 'react';

export default function ModifierCardFront(props) {
  return <img alt="" className="cover" src={props.image} />;
}

ModifierCardFront.propTypes = {
  image: PropTypes.string.isRequired,
};

import PropTypes from 'prop-types';
import React from 'react';

import { cover } from './style/Card.scss';

export default function ModifierCardFront(props) {
  return <img alt="" className={cover} src={props.image} />;
}

ModifierCardFront.propTypes = {
  image: PropTypes.string.isRequired,
};

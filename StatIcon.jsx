import PropTypes from 'prop-types';
import React from 'react';

import classNames from 'classnames';
import * as css from './style/Card.scss';

const REMAP_LUT = {
  flying: { invert: true, icon: 'images/fly.svg' },
  attack: { invert: true },
  heal: { invert: true },
  jump: { invert: true },
  loot: { invert: true },
  move: { invert: true },
  pull: { invert: true },
  push: { invert: true },
  range: { invert: true },
  retaliate: { invert: true },
  shield: { invert: true },
  target: { invert: true },
};

export default function StatIcon(props) {
  const parse = /^%?([^%]+)%?$/;
  const match = parse.exec(props.name);
  const cnames = [props.className];
  let img_src = `images/${match[1]}.svg`;

  if (REMAP_LUT[match[1]]) {
    const entry = REMAP_LUT[match[1]];

    if (entry.icon) {
      img_src = entry.icon;
    }

    if (entry.invert) {
      cnames.push(css.invertIcon);
    }
  }

  return <img className={classNames(cnames)} src={img_src} alt="" />;
}

StatIcon.defaultProps = {
  className: [],
};

StatIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
};

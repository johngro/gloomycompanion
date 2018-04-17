import PropTypes from 'prop-types';
import React from 'react';

import { expand_string } from './macros';
import { remove_empty_strings } from './util';

import * as css from './style/Card.scss';

function CardLines(props) {
  const children = props.elements.map((e) => {
    if (Array.isArray(e)) {
      return <li><CardLines elements={e} style={props.style} /></li>;
    }
    return <li dangerouslySetInnerHTML={{ __html: e }} />; // eslint-disable-line react/no-danger
  });
  return <ul style={props.style}>{children}</ul>;
}

CardLines.propTypes = {
  elements: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ])).isRequired,
  style: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default function AbilityCardFront(props) {
  const listStack = [[]];

  const lines = remove_empty_strings(props.lines);
  for (let line of lines) {
    const depth = /[^*]/.exec(line).index;
    line = line.substr(depth);

    while (listStack.length != depth) {
      if (listStack.length < depth) {
        // Need one level lower, create <ul>
        const newList = [];
        listStack[listStack.length - 1].push(newList);
        listStack.push(newList);
      } else {
        listStack.pop();
      }
    }

    const innerHtml = expand_string(line.trim(), props.attack, props.move, props.range);
    listStack[listStack.length - 1].push(innerHtml);
  }

  // Dynamically adapt the size to the line length. I found this the sweet spot to read all the cards
  const listStyle = {};
  if (lines.length > 5) {
    listStyle.fontSize = `${100 - (lines.length * 2.5)}%`;
  }

  return (
    <React.Fragment>
      <span className={css.name}>{props.name}-{props.level}</span>
      <span className={css.healthNormal}>HP {props.health[0]}</span>
      {props.health[1] > 0 && <span className={css.healthElite}>HP {props.health[1]}</span>}
      <span className={css.initiative}>{props.initiative}</span>
      {props.shuffle && <img alt="Shuffle requried" src="images/shuffle.svg" />}
      <CardLines elements={listStack[0]} style={listStyle} />
    </React.Fragment>
  );
}

AbilityCardFront.propTypes = {
  initiative: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  shuffle: PropTypes.bool.isRequired,
  lines: PropTypes.arrayOf(PropTypes.string).isRequired,
  attack: PropTypes.arrayOf(PropTypes.number).isRequired,
  move: PropTypes.arrayOf(PropTypes.number).isRequired,
  range: PropTypes.arrayOf(PropTypes.number).isRequired,
  level: PropTypes.string.isRequired,
  health: PropTypes.arrayOf(PropTypes.number).isRequired,
};

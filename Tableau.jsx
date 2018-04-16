import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import AbilityDeck from './AbilityDeck';
import DeckState from './DeckState';
import { DECK_DEFINITONS } from './cards';

const DEFINITIONS_BY_CLASS = {};
for (const definition of DECK_DEFINITONS) {
  DEFINITIONS_BY_CLASS[definition.class] = definition;
}

function VisibilityMenu(props) {
  return ReactDOM.createPortal(props.deckSpecs.map(spec => (
    <li className="currentdeck" key={spec.id}>
      <a
        href={`#switch-${spec.id}`}
        onClick={() => props.onToggleVisibility(spec.id)}
      >
        {spec.name}
      </a>
    </li>
  )), props.target);
}

VisibilityMenu.propTypes = {
  deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
  target: PropTypes.instanceOf(Element).isRequired,
};

export default class Tableau extends React.Component {
  // FIXME: Implement state storage

  static getDerivedStateFromProps(nextProps, prevState) {
    const deckHidden = {};
    const deckState = {};
    for (const spec of nextProps.deckSpecs) {
      deckHidden[spec.id] = prevState.deckHidden[spec.id] || false;
      if (!(spec.class in deckState)) {
        if (spec.class in prevState.deckState) {
          deckState[spec.class] = prevState.deckState[spec.class];
        } else {
          deckState[spec.class] = DeckState.create(DEFINITIONS_BY_CLASS[spec.class], spec.name);
        }
      }
    }
    return { deckHidden, deckState };
  }

  static propTypes = {
    deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
  }

  state = {
    deckHidden: {},
    deckState: {},
  }

  handleDeckClick(deckClass) {
    this.setState(({ deckState }) => ({
      deckState: {
        ...deckState,
        [deckClass]: deckState[deckClass].mustReshuffle() ?
          deckState[deckClass].reshuffle() :
          deckState[deckClass].draw_card(),
      },
    }));
  }

  handleToggleVisibility = (deckId) => {
    this.setState(({ deckHidden }) => ({
      deckHidden: { ...deckHidden, [deckId]: !deckHidden[deckId] },
    }));
  }

  render() {
    const decks = this.props.deckSpecs.map(spec => (
      <AbilityDeck
        key={spec.id}
        spec={spec}
        deckState={this.state.deckState[spec.class]}
        onClick={() => this.handleDeckClick(spec.class)}
        hidden={this.state.deckHidden[spec.id]}
      />
    ));
    return (
      <React.Fragment>
        <VisibilityMenu
          deckSpecs={this.props.deckSpecs}
          onToggleVisibility={this.handleToggleVisibility}
          target={document.getElementById('currentdeckslist')}
        />
        <div id="modifier-container-container" />
        {decks}
      </React.Fragment>
    );
  }
}

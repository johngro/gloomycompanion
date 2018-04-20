import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import AbilityDeck from './AbilityDeck';
import DeckState from './DeckState';
import ModifierDeck from './ModifierDeck';
import ModifierDeckState from './ModifierDeckState';
import { DECK_DEFINITONS } from './cards';

import { currentDeck } from './style/Tableau.scss';

const DEFINITIONS_BY_CLASS = {};
for (const definition of DECK_DEFINITONS) {
  DEFINITIONS_BY_CLASS[definition.class] = definition;
}

function VisibilityMenu(props) {
  return ReactDOM.createPortal(props.deckSpecs.map(spec => (
    <li className={currentDeck} key={spec.id}>
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
    modDeckState: ModifierDeckState.create(),
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

  handleModDeckDraw = () => {
    this.setState(({ modDeckState }) => ({
      modDeckState: modDeckState.draw_card(),
    }));
  }

  handleModDeckDoubleDraw = () => {
    this.setState(({ modDeckState }) => ({
      modDeckState: modDeckState.draw_two_cards(),
    }));
  }

  handleModDeckEndRound = () => {
    this.setState(({ modDeckState }) => ({
      modDeckState: modDeckState.end_round(),
    }));
  }

  handleModDeckAddSpecial = (type) => {
    this.setState(({ modDeckState }) => ({
      modDeckState: modDeckState.add_card(type),
    }));
  }

  handleModDeckRemoveSpecial = (type) => {
    this.setState(({ modDeckState }) => ({
      modDeckState: modDeckState.remove_card(type),
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
        <ModifierDeck
          deckState={this.state.modDeckState}
          onDrawClick={this.handleModDeckDraw}
          onDoubleDrawClick={this.handleModDeckDoubleDraw}
          onEndRoundClick={this.handleModDeckEndRound}
          onAddSpecialClick={this.handleModDeckAddSpecial}
          onRemoveSpecialClick={this.handleModDeckRemoveSpecial}
        />
        {decks}
      </React.Fragment>
    );
  }
}

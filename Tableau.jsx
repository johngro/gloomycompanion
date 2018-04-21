import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import AbilityDeck from './AbilityDeck';
import DeckState from './DeckState';
import ModifierDeck from './ModifierDeck';
import ModifierDeckState from './ModifierDeckState';
import { DECK_DEFINITONS } from './cards';
import firebase from './firebase';

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
    if (nextProps.useFirebase) {
      firebase.database().ref('deck_hidden').set(deckHidden);
      firebase.database().ref('deck_state').set(deckState);
      return { };
    }
    return { deckState, deckHidden };
  }

  static propTypes = {
    deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
    useFirebase: PropTypes.bool.isRequired,
  }

  state = {
    deckHidden: {},
    deckState: {},
    modDeckState: ModifierDeckState.create(),
  }

  componentDidMount() {
    if (this.props.useFirebase) {
      this.modifierRef = firebase.database().ref('modifier');
      this.modifierRef.on('value', this.onModifierChange, this);
      this.deckHiddenRef = firebase.database().ref('deck_hidden');
      this.deckHiddenRef.on('value', this.onDeckHiddenChange, this);
      this.deckStateRef = firebase.database().ref('deck_state');
      this.deckStateRef.on('value', this.onDeckStateChange, this);
    }
  }

  componentWillUnmount() {
    if (this.props.useFirebase) {
      this.modifierRef.off('value', this.onModifierChange, this);
      this.deckHiddenRef.off('value', this.onDeckHiddenChange, this);
      this.deckStateRef.off('value', this.onDeckStateChange, this);
    }
  }

  onModifierChange(snapshot) {
    this.setState({
      modDeckState: ModifierDeckState.create(snapshot.val()),
    });
  }

  onDeckStateChange(snapshot) {
    const deckState = {};
    const upstream = snapshot.val();
    for (const spec in upstream) {
      deckState[spec] = DeckState.create(DEFINITIONS_BY_CLASS[spec], upstream[spec].name, upstream[spec]);
    }
    this.setState({ deckState });
  }

  onDeckHiddenChange(snapshot) {
    this.setState({ deckHidden: snapshot.val() || {} });
  }

  handleDeckClick(deckClass) {
    const mutation = deckState => ({
      ...deckState,
      [deckClass]: deckState[deckClass].mustReshuffle() ?
        deckState[deckClass].reshuffle() :
        deckState[deckClass].draw_card(),
    });
    if (this.props.useFirebase) {
      const deckState = mutation(this.state.deckState);
      this.deckStateRef.set(deckState);
    } else {
      this.setState(({ deckState }) => ({
        deckState: mutation(deckState),
      }));
    }
  }

  mutateModDeck(mutation) {
    if (this.props.useFirebase) {
      const modDeckState = mutation(this.state.modDeckState);
      this.modifierRef.set(modDeckState.toJSON());
    } else {
      this.setState(({ modDeckState }) => ({
        modDeckState: mutation(modDeckState),
      }));
    }
  }

  handleModDeckDraw = () => {
    const mutation = deckState => deckState.draw_card();
    this.mutateModDeck(mutation);
  }

  handleModDeckDoubleDraw = () => {
    const mutation = deckState => deckState.draw_two_cards();
    this.mutateModDeck(mutation);
  }

  handleModDeckEndRound = () => {
    const mutation = deckState => deckState.end_round();
    this.mutateModDeck(mutation);
  }

  handleModDeckAddSpecial = (type) => {
    const mutation = deckState => deckState.add_card(type);
    this.mutateModDeck(mutation);
  }

  handleModDeckRemoveSpecial = (type) => {
    const mutation = deckState => deckState.remove_card(type);
    this.mutateModDeck(mutation);
  }

  handleToggleVisibility = (deckId) => {
    const mutation = deckHidden => ({ ...deckHidden, [deckId]: !deckHidden[deckId] });
    if (this.props.useFirebase) {
      const deckHidden = mutation(this.state.deckHidden);
      firebase.database().ref('deck_hidden').set(deckHidden);
    } else {
      this.setState(({ deckHidden }) => ({
        deckHidden: mutation(deckHidden),
      }));
    }
  }

  render() {
    const decks = this.props.deckSpecs.map((spec) => {
      if (!(spec.class in this.state.deckState) ||
          !(spec.id in this.state.deckHidden)) {
        return null;
      }
      return (
        <AbilityDeck
          key={spec.id}
          spec={spec}
          deckState={this.state.deckState[spec.class]}
          onClick={() => this.handleDeckClick(spec.class)}
          hidden={this.state.deckHidden[spec.id]}
        />
      );
    });
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

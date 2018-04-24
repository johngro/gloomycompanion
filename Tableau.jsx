import PropTypes from 'prop-types';
import React from 'react';

import AbilityDeck from './AbilityDeck';
import DeckState from './DeckState';
import ModifierDeck from './ModifierDeck';
import ModifierDeckState from './ModifierDeckState';
import { DECK_DEFINITONS } from './cards';
import firebase from './firebase';

const DEFINITIONS_BY_CLASS = {};
for (const definition of DECK_DEFINITONS) {
  DEFINITIONS_BY_CLASS[definition.class] = definition;
}

export default class Tableau extends React.Component {
  // FIXME: Support right-click to hide decks

  static getDerivedStateFromProps(nextProps, prevState) {
    const deckState = {};
    for (const spec of nextProps.deckSpecs) {
      if (!(spec.class in deckState)) {
        if (spec.class in prevState.deckState) {
          deckState[spec.class] = prevState.deckState[spec.class];
        } else {
          deckState[spec.class] = DeckState.create(DEFINITIONS_BY_CLASS[spec.class], spec.name);
        }
      }
    }
    if (nextProps.useFirebase) {
      firebase.database().ref('deck_state').set(deckState);
      return { };
    }
    return { deckState };
  }

  static propTypes = {
    deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
    deckVisible: PropTypes.objectOf(PropTypes.bool).isRequired,
    modDeckHidden: PropTypes.bool.isRequired,
    useFirebase: PropTypes.bool.isRequired,
  }

  state = {
    deckState: {},
    modDeckState: ModifierDeckState.create(),
  }

  componentDidMount() {
    if (this.props.useFirebase) {
      this.modifierRef = firebase.database().ref('modifier');
      this.modifierRef.on('value', this.onModifierChange, this);
      this.deckStateRef = firebase.database().ref('deck_state');
      this.deckStateRef.on('value', this.onDeckStateChange, this);
    }
  }

  componentWillUnmount() {
    if (this.props.useFirebase) {
      this.modifierRef.off('value', this.onModifierChange, this);
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

  reset() {
    this.setState({
      deckState: {},
      modDeckState: ModifierDeckState.create(),
    });
  }

  render() {
    const decks = this.props.deckSpecs.map((spec) => {
      if (!(spec.class in this.state.deckState)) {
        return null;
      }
      return (
        <AbilityDeck
          key={spec.id}
          spec={spec}
          deckState={this.state.deckState[spec.class]}
          onClick={() => this.handleDeckClick(spec.class)}
          hidden={!this.props.deckVisible[spec.id]}
        />
      );
    });

    return (
      <div id="tableau" style={{ fontSize: '26.6px' }}>
        <ModifierDeck
          deckState={this.state.modDeckState}
          hidden={this.props.modDeckHidden}
          onDrawClick={this.handleModDeckDraw}
          onDoubleDrawClick={this.handleModDeckDoubleDraw}
          onEndRoundClick={this.handleModDeckEndRound}
          onAddSpecialClick={this.handleModDeckAddSpecial}
          onRemoveSpecialClick={this.handleModDeckRemoveSpecial}
        />
        {decks}
      </div>
    );
  }
}

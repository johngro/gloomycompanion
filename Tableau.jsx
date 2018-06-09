import PropTypes from 'prop-types';
import React from 'react';

import AbilityDeck from './AbilityDeck';
import DeckState from './DeckState';
import ModifierDeck from './ModifierDeck';
import ModifierDeckState from './ModifierDeckState';
import { DECK_DEFINITONS } from './cards';
import { storageValueProp, withStorage } from './storage';

import * as CardCss from './style/Card.scss';
import * as css from './style/Tableau.scss';

const DEFINITIONS_BY_CLASS = {};
for (const definition of DECK_DEFINITONS) {
  DEFINITIONS_BY_CLASS[definition.class] = definition;
}

// This should be dynamic dependant on lines per card
function refresh_ui() {
  const actual_card_height = 296;
  const base_font_size = 26.6;

  const tableau = document.getElementById(css.tableau);
  const cards = tableau.getElementsByClassName(CardCss.card);
  for (let i = 0; i < cards.length; i += 1) {
    if (cards[i].className.indexOf(CardCss.ability) !== -1 && cards[i].offsetParent !== null) {
      const scale = cards[i].getBoundingClientRect().height / actual_card_height;
      const scaled_font_size = base_font_size * scale;

      const font_pixel_size = Math.min(scaled_font_size, base_font_size);
      tableau.style.fontSize = `${font_pixel_size}px`;
      break;
    }
  }
}

class Tableau extends React.Component {
  // FIXME: Support right-click to hide decks

  static propTypes = {
    deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
    deckState: storageValueProp(PropTypes.object).isRequired,
    deckVisible: PropTypes.objectOf(PropTypes.bool).isRequired,
    modDeckHidden: PropTypes.bool.isRequired,
    modDeckState: storageValueProp(PropTypes.object).isRequired,
  }

  componentDidMount() {
    refresh_ui();
    window.addEventListener('resize', refresh_ui);
  }

  componentDidUpdate(prevProps) {
    for (const spec of this.props.deckSpecs) {
      const hadSpec = prevProps.deckSpecs.some(s => s.id === spec.id);
      const haveState = spec.class in this.props.deckState.value;
      if (!hadSpec || !haveState) {
        // Make a new state!
        console.log(`new spec: ${spec.id}`);
        this.props.deckState.mutate(deckState => ({
          ...deckState,
          [spec.class]: DeckState.create(DEFINITIONS_BY_CLASS[spec.class], spec.name),
        }));
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', refresh_ui);
  }

  handleDeckClick(deckClass) {
    const mutation = deckState => ({
      ...deckState,
      [deckClass]: deckState[deckClass].mustReshuffle() ?
        deckState[deckClass].reshuffle() :
        deckState[deckClass].draw_card(),
    });
    this.props.deckState.mutate(mutation);
  }

  mutateModDeck(mutation) {
    this.props.modDeckState.mutate(mutation);
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

  render() {
    const decks = this.props.deckSpecs.map((spec) => {
      if (!(spec.class in this.props.deckState.value)) {
        return null;
      }
      return (
        <AbilityDeck
          key={spec.id}
          spec={spec}
          deckState={this.props.deckState.value[spec.class]}
          onClick={() => this.handleDeckClick(spec.class)}
          hidden={!this.props.deckVisible[spec.id]}
        />
      );
    });

    return (
      <div id={css.tableau} style={{ fontSize: '26.6px' }}>
        <ModifierDeck
          deckState={this.props.modDeckState.value}
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

export default withStorage(Tableau, {
  modDeckState: {
    path: 'modifier',
    deserialize: ModifierDeckState.create,
    serialize: s => s.toJSON(),
  },
  deckState: {
    path: 'deck_state',
    deserialize: (value) => {
      const result = {};
      for (const [deckClass, state] of Object.entries(value || {})) {
        result[deckClass] = DeckState.create(DEFINITIONS_BY_CLASS[deckClass], state.name, state);
      }
      return result;
    },
  },
});

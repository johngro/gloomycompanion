import PropTypes from 'prop-types';
import React from 'react';

import AbilityCardBack from './AbilityCardBack';
import AbilityCardFront from './AbilityCardFront';
import Card from './Card';
import { DECK_DEFINITONS, DECKS } from './cards';
import { attributes_to_lines, immunities_to_lines, notes_to_lines, special_to_lines } from './macros';
import { MONSTER_STATS } from './monster_stats';
import { find_in_discard, shuffle_list } from './util';

const DEFINITIONS_BY_CLASS = {};
for (const definition of DECK_DEFINITONS) {
  DEFINITIONS_BY_CLASS[definition.class] = definition;
}

class DeckState {
  constructor(draw_pile, discard, name) {
    this.draw_pile = draw_pile;
    this.discard = discard;
    this.name = name;
  }

  static create(definition, name, storageState) {
    const draw_pile = [];
    const discard = [];

    for (const [i, cardDef] of definition.cards.entries()) {
      const [shuffle, initiative, ...lines] = cardDef;
      const card = {
        id: `${name}_${i}`,
        shuffle_next: shuffle,
        initiative,
        starting_lines: lines,
      };

      if (storageState && find_in_discard(storageState.discard, card.id)) {
        discard.push(card);
      } else {
        draw_pile.push(card);
      }
    }

    return new DeckState(draw_pile, discard, name);
  }

  draw_card() {
    const drewCard = this.draw_pile[0];
    return new DeckState(this.draw_pile.slice(1), [drewCard, ...this.discard], this.name);
  }

  reshuffle() {
    const newDraw = [...this.draw_pile, ...this.discard];
    shuffle_list(newDraw);
    return new DeckState(newDraw, [], this.name);
  }
}

export default class AbilityDeck extends React.Component {
  // FIXME: Reshuffle animation
  // FIXME: Implement state storage
  // FIXME: Draw animation repeats when unhiding

  static getDerivedStateFromProps(nextProps, prevState) {
    if (prevState.deck && prevState.deck.name === nextProps.deckName) {
      return null;
    }
    return { deck: DeckState.create(DEFINITIONS_BY_CLASS[nextProps.deckClass], nextProps.deckName) };
  }

  static defaultProps = {
    hidden: false,
    id: null,
  }

  static propTypes = {
    deckClass: PropTypes.string.isRequired,
    deckName: PropTypes.string.isRequired,
    level: PropTypes.number.isRequired,
    hidden: PropTypes.bool,
    id: PropTypes.string,
  }

  state = {}

  isBoss() {
    return this.props.deckClass === DECKS.Boss.class;
  }

  mustReshuffle() {
    if (!this.state.deck.draw_pile.length) {
      return true;
    }
    if (this.state.deck.discard.length) {
      return this.state.deck.discard[0].shuffle_next;
    }
    return false;
  }

  handleClick = () => {
    if (this.mustReshuffle()) {
      this.setState(({ deck }) => ({ deck: deck.reshuffle() }));
    } else {
      this.setState(({ deck }) => ({ deck: deck.draw_card() }));
    }
  }

  render() {
    // Calculate monster stats and text that goes on every card
    let stats = {};
    let attack = [0, 0];
    let move = [0, 0];
    let range = [0, 0];
    let health = [0, 0];
    let extra_lines = [];
    if (this.isBoss() && this.props.deckName !== 'Boss') {
      const bossName = this.props.deckName.replace('Boss: ', '');
      stats = MONSTER_STATS.bosses[bossName].level[this.props.level];
      attack = [stats.attack];
      move = [stats.move];
      range = [stats.range];
      health = [stats.health];
      if (stats.immunities) {
        extra_lines = extra_lines.concat(immunities_to_lines(stats.immunities));
      }
      if (stats.notes) {
        extra_lines = extra_lines.concat(notes_to_lines(stats.notes));
      }
    } else if (!this.isBoss()) {
      const stats = MONSTER_STATS.monsters[this.props.deckName].level[this.props.level];
      attack = [stats.normal.attack, stats.elite.attack];
      move = [stats.normal.move, stats.elite.move];
      range = [stats.normal.range, stats.elite.range];
      health = [stats.normal.health, stats.elite.health];
      const attributes = [stats.normal.attributes, stats.elite.attributes];
      extra_lines = extra_lines.concat(attributes_to_lines(attributes));
    }

    const renderCard = (card, zIndex, cardClasses, faceUp) => {
      // Apply Special1/2 macros for Boss cards
      let cards_lines = card.starting_lines;
      if (this.isBoss()) {
        let new_lines = [];
        for (const line of cards_lines) {
          new_lines = new_lines.concat(special_to_lines(line, stats.special1, stats.special2));
        }
        cards_lines = new_lines;
      }

      return (
        <Card
          classes={cardClasses}
          key={card.id}
          deckType="ability"
          faceUp={faceUp}
          zIndex={zIndex}
          renderBack={() => (
            <AbilityCardBack name={this.props.deckName} level={this.props.level.toString()} />
          )}
          renderFront={() => (
            <AbilityCardFront
              initiative={card.initiative}
              name={this.props.deckName}
              shuffle={card.shuffle_next}
              lines={cards_lines.concat(extra_lines)}
              attack={attack}
              move={move}
              range={range}
              level={this.props.level.toString()}
              health={health}
            />
          )}
        />
      );
    };

    const [topDraw] = this.state.deck.draw_pile;
    const [topDiscard, sndDiscard] = this.state.deck.discard;
    return (
      <div
        id={this.props.id}
        className={this.props.hidden ? 'hiddendeck' : 'card-container'}
        onClick={this.handleClick}
      >
        {topDraw ? renderCard(topDraw, -7, ['draw'], false) : null}
        {topDiscard ? renderCard(topDiscard, -3, ['discard', 'pull'], true) : null}
        {sndDiscard ? renderCard(sndDiscard, -4, ['discard', 'lift'], true) : null}
      </div>
    );
  }
}

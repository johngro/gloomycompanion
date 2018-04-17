import PropTypes from 'prop-types';
import React from 'react';

import AbilityCardBack from './AbilityCardBack';
import AbilityCardFront from './AbilityCardFront';
import Card from './Card';
import DeckState from './DeckState';
import { DECKS } from './cards';
import { attributes_to_lines, immunities_to_lines, notes_to_lines, special_to_lines } from './macros';
import { MONSTER_STATS } from './monster_stats';

import * as css from './style/Card.scss';

export default function AbilityDeck(props) {
  // FIXME: Reshuffle animation
  // FIXME: Draw animation repeats when unhiding
  const { spec } = props;

  // Calculate monster stats and text that goes on every card
  let stats = {};
  let attack = [0, 0];
  let move = [0, 0];
  let range = [0, 0];
  let health = [0, 0];
  let extra_lines = [];
  const isBoss = spec.class === DECKS.Boss.class;
  if (isBoss && spec.name !== 'Boss') {
    const bossName = spec.name.replace('Boss: ', '');
    stats = MONSTER_STATS.bosses[bossName].level[spec.level];
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
  } else if (!isBoss) {
    const stats = MONSTER_STATS.monsters[spec.name].level[spec.level];
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
    if (isBoss) {
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
          <AbilityCardBack name={spec.name} level={spec.level.toString()} />
        )}
        renderFront={() => (
          <AbilityCardFront
            initiative={card.initiative}
            name={spec.name}
            shuffle={card.shuffle_next}
            lines={cards_lines.concat(extra_lines)}
            attack={attack}
            move={move}
            range={range}
            level={spec.level.toString()}
            health={health}
          />
        )}
      />
    );
  };

  const [topDraw] = props.deckState.draw_pile;
  const [topDiscard, sndDiscard] = props.deckState.discard;
  return (
    <div
      id={spec.id}
      className={props.hidden ? css.hiddenDeck : css.cardContainer}
      onClick={props.onClick}
    >
      {topDraw ? renderCard(topDraw, -7, [css.draw], false) : null}
      {topDiscard ? renderCard(topDiscard, -3, [css.discard, css.pull], true) : null}
      {sndDiscard ? renderCard(sndDiscard, -4, [css.discard, css.lift], true) : null}
    </div>
  );
}

AbilityDeck.defaultProps = {
  hidden: false,
};

AbilityDeck.propTypes = {
  spec: PropTypes.shape({
    id: PropTypes.string.isRequired,
    class: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    level: PropTypes.number.isRequired,
  }).isRequired,
  deckState: PropTypes.instanceOf(DeckState).isRequired,
  onClick: PropTypes.func.isRequired,
  hidden: PropTypes.bool,
};

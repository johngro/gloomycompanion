import PropTypes from 'prop-types';
import React from 'react';

import AbilityCardBack from './AbilityCardBack';
import AbilityCardFront from './AbilityCardFront';
import ButtonDiv from './ButtonDiv';
import Card from './Card';
import DeckState from './DeckState';
import { DECKS } from './cards';
import { attributes_to_lines, immunities_to_lines, notes_to_lines, special_to_lines } from './macros';
import { MONSTER_STATS } from './monster_stats';

import * as css from './style/Card.scss';

function StatIcon(props) {
  const parse = /^%?([^%]+)%?$/;
  const match = parse.exec(props.name);
  const imgSource = `images/${match[1]}.svg`;
  return <img className={props.className} src={imgSource} alt="" />;
}

StatIcon.defaultProps = {
  className: null,
};

StatIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
};

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
  let attributes = [];
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
    attributes = [stats.normal.attributes, stats.elite.attributes];
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

  const renderBaseStats = () => {
    if (!props.showBaseStats) {
      return null;
    }

    const statLine = (iconName, data) => {
      const bossData = (data.length === 1);
      const empty = (data[0] === 0) && (bossData || (data[1] === 0));
      if (empty) {
        return null;
      }

      const value = bossData ? String(data[0]) : `${data[0]}/${data[1]}`;
      return (
        <tr>
          <td><StatIcon name={iconName} className={css.baseStatIcon} /></td>
          <td>{value}</td>
        </tr>
      );
    };

    const attr_parse = /^%(\S+)%(\s+([0-9]+))?/;
    const attr_dict = { };
    for (const i in attributes) {
      for (const j in attributes[i]) {
        const match = attr_parse.exec(attributes[i][j]);
        if (match) {
          const name = match[1];
          if (!(name in attr_dict)) {
            attr_dict[name] = [0, 0];
          }
          attr_dict[name][i] = match[3] ? match[3] : 1;
        }
      }
    }

    const attr_lines = Object.keys(attr_dict).map(key =>
      statLine(key, attr_dict[key]));
    return (
      <table className={css.baseStatTable}>
        { statLine('heal', health) }
        { statLine('move', move) }
        { statLine('attack', attack) }
        { statLine('range', range) }
        {attr_lines}
      </table>
    );
  };

  const renderBossExtras = () => {
    const immLine = () => {
      if (!stats.immunities) {
        return null;
      }

      const Icon = x => <StatIcon name={x} className={css.immunityIcon} />;
      const icons = stats.immunities
        ? Object.keys(stats.immunities).map(key => Icon(stats.immunities[key]))
        : null;
      return (
        <li>Immunities: {icons}</li>
      );
    };

    const notes = () => (stats.notes ? <li>{stats.notes}</li> : null);

    return (
      <ul className={css.bossExtras}>
        { immLine() }
        { notes() }
      </ul>
    );
  };

  const [topDraw] = props.deckState.draw_pile;
  const [topDiscard, sndDiscard] = props.deckState.discard;
  const pullAnim = props.showFlip ? css.pull : null;
  const liftAnim = props.showFlip ? css.lift : null;
  return (
    <div
      className={props.hidden ? css.hiddenDeck : null}
    >
      <div className={css.rowContainer}>
        <ButtonDiv
          className={css.cardContainer}
          onClick={props.onClick}
        >
          {topDraw ? renderCard(topDraw, -7, [css.draw], false) : null}
          {topDiscard ? renderCard(topDiscard, -3, [css.discard, pullAnim], true) : null}
          {sndDiscard ? renderCard(sndDiscard, -4, [css.discard, liftAnim], true) : null}
        </ButtonDiv>
        { props.showBaseStats ? renderBaseStats() : null }
      </div>
      { props.showBaseStats ? renderBossExtras() : null }
    </div>
  );
}

AbilityDeck.defaultProps = {
  hidden: false,
  showBaseStats: false,
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
  showFlip: PropTypes.bool.isRequired,
  hidden: PropTypes.bool,
  showBaseStats: PropTypes.bool,
};

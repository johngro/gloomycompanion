import PropTypes from 'prop-types';
import React from 'react';

import AbilityCardBack from './AbilityCardBack';
import AbilityCardFront from './AbilityCardFront';
import ButtonDiv from './ButtonDiv';
import Card from './Card';
import DeckState from './DeckState';
import StatIcon from './StatIcon';
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

  // Parse the attributes and store them in structures we will use when we need to render base
  // stats.  We divide attributes into three categories.
  // 1) Integer attributes.  Things like, "Shield 5" or "Target 2", or even "Retaliate 2: Range 2".
  // 2) Bool attributes.  Things like "Flying", or "Poison".
  // 3) Text attributes.  Things like "Attacker gains disadvantage"
  const attr_parse = /^%(\S+)%(\s+([0-9]+))?(:\s*%(\S+)%(\s+([0-9]+)))?$/;
  const int_attr_dict = { };
  const txt_attr_dict = { };
  const bool_attrs = [[], []];
  for (const i in attributes) {
    for (const j in attributes[i]) {
      const text = attributes[i][j];
      const match = attr_parse.exec(text);
      const name = match ? match[1] : text;

      if (!match) {
        // No match => Text attribute
        if (!(name in txt_attr_dict)) {
          txt_attr_dict[name] = [0, 0];
        }
        txt_attr_dict[name][i] = 1;
      } else
      if (!match[3]) {
        // No number after the icon => bool attribute
        bool_attrs[i].push(name);
      } else {
        // Must be an integer attribute, perhaps with an extra modifier.
        if (!(name in int_attr_dict)) {
          int_attr_dict[name] = [[0], [0]];
        }

        int_attr_dict[name][i] = [match[3]];
        if (match[5]) {
          int_attr_dict[name][i].push(match[5]);
          if (match[7]) {
            int_attr_dict[name][i].push(match[7]);
          }
        }
      }
    }
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

    // Transform [a, b, c, ...] into [[a], [b], [c], ...]
    const wrap_array = x => x.map(y => [y]);

    const intStatLine = (iconName, data) => {
      const bossData = (data.length === 1);
      const empty = (data[0][0] === 0) && (bossData || (data[1][0] === 0));
      if (empty) {
        return null;
      }

      const render_val = val => val.map((v, k) => {
        if ((k % 2) != 0) {
          return <StatIcon name={v} className={css.intStatIcon} />;
        }
        return (v == 0) ? '-' : String(v);
      });

      return bossData
        ? (
          <tr>
            <td className={css.baseStateId}>
              <StatIcon name={iconName} className={css.intStatIcon} />
            </td>
            <td className={css.baseStatRight}>{render_val(data[0])}</td>
          </tr>
        )
        : (
          <tr>
            <td className={css.baseStatLeft}>{render_val(data[0])}</td>
            <td className={css.baseStatId}>
              <StatIcon name={iconName} className={css.intStatIcon} />
            </td>
            <td className={css.baseStatRight}>{render_val(data[1])}</td>
          </tr>
        );
    };

    const boolStatLine = (mobType, data) => {
      if (!data.length) {
        return null;
      }

      const icons = data.map(iconName => <StatIcon name={iconName} className={css.boolStatIcon} />);
      return (
        <tr>
          <td>{mobType}</td>
          <td>{icons}</td>
        </tr>
      );
    };

    const attr_lines = Object.keys(int_attr_dict).map(key =>
      intStatLine(key, int_attr_dict[key]));

    return (
      <div className={css.baseStats}>
        <table>
          { intStatLine('heal', wrap_array(health)) }
          { intStatLine('move', wrap_array(move)) }
          { intStatLine('attack', wrap_array(attack)) }
          { intStatLine('range', wrap_array(range)) }
          {attr_lines}
        </table>
        { (bool_attrs[0].length || bool_attrs[1].length) ? <hr /> : null }
        <table>
          { boolStatLine('N', bool_attrs[0]) }
          { boolStatLine('E', bool_attrs[1]) }
        </table>
      </div>
    );
  };

  const renderBossExtras = () => {
    const text_attrs = Object.keys(txt_attr_dict).map((key) => {
      const who = txt_attr_dict[key];
      let modifier = null;
      if (!who[0]) {
        modifier = ' (elite only)';
      } else
      if (!who[1]) {
        modifier = ' (normal only)';
      }
      return <li>{key}{modifier}</li>;
    });

    const immunity_line = () => {
      if (!stats.immunities) {
        return null;
      }

      const Icon = x => <StatIcon name={x} className={css.boolStatIcon} />;
      const icons = stats.immunities
        ? Object.keys(stats.immunities).map(key => Icon(stats.immunities[key]))
        : null;
      return <li>Immunities: {icons}</li>;
    };

    const notes = () => (stats.notes ? <li>{stats.notes}</li> : null);

    return (
      <div className={css.baseStats}>
        <ul>
          { text_attrs }
          { immunity_line() }
          { notes() }
        </ul>
      </div>
    );
  };

  const [topDraw] = props.deckState.draw_pile;
  const [topDiscard, sndDiscard] = props.deckState.discard;
  return (
    <div
      className={props.hidden ? css.hiddenDeck : css.abilityDeckContainer}
    >
      <div className={css.rowContainer}>
        <ButtonDiv
          className={css.cardContainer}
          onClick={props.onClick}
        >
          {topDraw ? renderCard(topDraw, -7, [css.draw], false) : null}
          {topDiscard ? renderCard(topDiscard, -3, [css.discard, css.pull], true) : null}
          {sndDiscard ? renderCard(sndDiscard, -4, [css.discard, css.lift], true) : null}
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
  hidden: PropTypes.bool,
  showBaseStats: PropTypes.bool,
};

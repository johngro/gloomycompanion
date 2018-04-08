import React from 'react';

import LevelSelector from './LevelSelector';
import { DECKS } from './cards';
import { SCENARIO_DEFINITIONS, SPECIAL_RULES } from './scenarios';

export default class ScenarioList extends React.Component {
  constructor(props) {
    super(props);
    this.levelSelector = React.createRef();
    this.scenarioSelector = React.createRef();
  }

  get_selection() {
    // We're using the scenario index that is zero-based, but the scenario list is 1-based
    const current_value = this.scenarioSelector.current.value - 1;
    return Math.min(current_value, SCENARIO_DEFINITIONS.length + 1);
  }

  get_level(deck_name, special_rules) {
    const base_level = this.levelSelector.current.get_selection();

    if ((special_rules.indexOf(SPECIAL_RULES.living_corpse_two_levels_extra) >= 0) && (deck_name == SPECIAL_RULES.living_corpse_two_levels_extra.affected_deck)) {
      return Math.min(7, (parseInt(base_level) + parseInt(SPECIAL_RULES.living_corpse_two_levels_extra.extra_levels)));
    }
    return base_level;
  }

  get_scenario_decks() {
    const scenarioDecks = SCENARIO_DEFINITIONS[this.get_selection()].decks;
    return scenarioDecks.map((deck) => {
      if (DECKS[deck.name]) {
        deck.class = DECKS[deck.name].class;
      } else if (deck.name.indexOf('Boss') != -1) {
        deck.class = DECKS.Boss.class;
      }
      deck.level = this.get_level(deck.name, this.get_special_rules());
      return deck;
    });
  }

  get_special_rules() {
    return SCENARIO_DEFINITIONS[this.get_selection()].special_rules || '';
  }

  render() {
    return (
      <ul className="selectionlist">
        <LevelSelector inline={false} text="Select level" ref={this.levelSelector} />
        <li>Select scenario number</li>
        <input
          max={SCENARIO_DEFINITIONS.length.toString()}
          min="1"
          name="scenario_number"
          type="number"
          defaultValue="1"
          ref={this.scenarioSelector}
        />
      </ul>
    );
  }
}

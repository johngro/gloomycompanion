import React from 'react';

import LevelSelector from './LevelSelector';
import { DECKS } from './cards';
import { SCENARIO_DEFINITIONS, SPECIAL_RULES } from './scenarios';

export default class ScenarioList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { level: 1, scenario: 0 };
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleScenarioChange = this.handleScenarioChange.bind(this);
  }

  get_scenario_decks() {
    const { decks, special_rules: specialRules = [] } = SCENARIO_DEFINITIONS[this.state.scenario];
    return decks.map((deck) => {
      if (DECKS[deck.name]) {
        deck.class = DECKS[deck.name].class;
      } else if (deck.name.indexOf('Boss') != -1) {
        deck.class = DECKS.Boss.class;
      }
      if ((specialRules.indexOf(SPECIAL_RULES.living_corpse_two_levels_extra) >= 0) && (deck.name == SPECIAL_RULES.living_corpse_two_levels_extra.affected_deck)) {
        deck.level = Math.min(7, (this.state.level + parseInt(SPECIAL_RULES.living_corpse_two_levels_extra.extra_levels)));
      } else {
        deck.level = this.state.level;
      }
      return deck;
    });
  }

  handleLevelChange(level) {
    this.setState({ level });
  }

  handleScenarioChange(event) {
    this.setState({
      scenario: Math.min(event.target.value - 1, SCENARIO_DEFINITIONS.length - 1),
    });
  }

  render() {
    return (
      <ul className="selectionlist">
        <LevelSelector
          inline={false}
          text="Select level"
          value={this.state.level}
          onChange={this.handleLevelChange}
        />
        <li>Select scenario number</li>
        <input
          max={SCENARIO_DEFINITIONS.length.toString()}
          min="1"
          name="scenario_number"
          type="number"
          value={this.state.scenario + 1}
          onChange={this.handleScenarioChange}
        />
      </ul>
    );
  }
}

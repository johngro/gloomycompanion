import React from 'react';

import LevelSelector from './LevelSelector';
import { makeDeckSpec } from './cards';
import { SCENARIO_DEFINITIONS, SPECIAL_RULES } from './scenarios';

import { selectionList } from './style/SettingsPane.scss';

export default class ScenarioList extends React.Component {
  state = { level: 1, scenario: 0 };

  getScenarioDecks() {
    const { decks, special_rules: specialRules = [] } = SCENARIO_DEFINITIONS[this.state.scenario];
    return decks.map(({ name }) => {
      let level = this.state.level;
      if ((specialRules.indexOf(SPECIAL_RULES.living_corpse_two_levels_extra) >= 0) && (name == SPECIAL_RULES.living_corpse_two_levels_extra.affected_deck)) {
        level = Math.min(7, (this.state.level + parseInt(SPECIAL_RULES.living_corpse_two_levels_extra.extra_levels)));
      }
      return makeDeckSpec(name, level);
    });
  }

  handleLevelChange = (level) => {
    this.setState({ level });
  }

  handleScenarioChange = (event) => {
    this.setState({
      scenario: Math.min(event.target.value - 1, SCENARIO_DEFINITIONS.length - 1),
    });
  }

  render() {
    return (
      <ul className={selectionList}>
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

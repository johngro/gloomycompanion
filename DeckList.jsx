import React from 'react';

import LevelSelector from './LevelSelector';
import { DECKS, makeDeckSpec } from './cards';

import { selectionList } from './style/SettingsPane.scss';

export default class DeckList extends React.Component {
  state = {
    checked: new Set(),
    globalLevel: 1,
    levels: Object.values(DECKS).reduce((levels, { name }) => {
      levels[name] = 1;
      return levels;
    }, {}),
  }

  getSelectedDecks() {
    const result = [];
    for (const name of this.state.checked) {
      result.push(makeDeckSpec(name, this.state.levels[name]));
    }
    return result;
  }

  setSelection(deckSpecs) {
    // FIXME: "Boss: " names get filtered out
    deckSpecs = deckSpecs.filter(d => d.name in DECKS);
    for (const spec of deckSpecs) {
      this.setDeckLevel(spec.name, spec.level);
    }
    this.setState({ checked: new Set(deckSpecs.map(d => d.name)) });
  }

  setDeckLevel(deckName, level) {
    this.setState(({ levels }) => ({
      levels: { ...levels, [deckName]: level },
    }));
  }

  handleCheckedChange = (event) => {
    const name = event.target.value;
    const isChecked = event.target.checked;
    this.setState(({ checked: oldChecked }) => {
      const checked = new Set(oldChecked);
      if (isChecked) {
        checked.add(name);
      } else {
        checked.delete(name);
      }
      return { checked };
    });
  }

  handleGlobalApplyClick = () => {
    for (const { name } of Object.values(DECKS)) {
      this.setDeckLevel(name, this.state.globalLevel);
    }
  }

  handleGlobalLevelChange = globalLevel => this.setState({ globalLevel })

  render() {
    const deckElements = Object.values(DECKS).map(({ name }) => (
      <li key={name}>
        <label>
          <input
            name="deck"
            type="checkbox"
            value={name}
            checked={this.state.checked.has(name)}
            onChange={this.handleCheckedChange}
          />
          {name}
        </label>
        <LevelSelector
          inline
          text=" with level "
          value={this.state.levels[name]}
          onChange={level => this.setDeckLevel(name, level)}
        />
      </li>
    ));
    return (
      <ul className={selectionList}>
        <li>
          <LevelSelector
            inline
            text="Select global level"
            value={this.state.globalLevel}
            onChange={this.handleGlobalLevelChange}
          />
          <input
            name="applylevel"
            type="button"
            value="Apply All"
            onClick={this.handleGlobalApplyClick}
          />
        </li>
        {deckElements}
      </ul>
    );
  }
}

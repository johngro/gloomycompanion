import React from 'react';

import LevelSelector from './LevelSelector';
import { DECKS } from './cards';

export default class DeckList extends React.Component {
  state = {
    checked: new Set(),
    globalLevel: 1,
    levels: Object.values(DECKS).reduce((levels, { name }) => {
      levels[name] = 1;
      return levels;
    }, {}),
  }

  get_selected_decks() {
    const result = [];
    for (const name of this.state.checked) {
      const deck = DECKS[name];
      deck.level = this.state.levels[name];
      result.push(deck);
    }
    return result;
  }

  set_selection(selected_deck_names) {
    // FIXME: "Boss: " names get filtered out
    selected_deck_names = selected_deck_names.filter(d => d.name in DECKS);
    for (const deck_names of selected_deck_names) {
      this.setDeckLevel(deck_names.name, deck_names.level);
    }
    this.setState({ checked: new Set(selected_deck_names.map(d => d.name)) });
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
      <ul className="selectionlist">
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

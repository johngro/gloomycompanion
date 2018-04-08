import React from 'react';

import LevelSelector from './LevelSelector';
import { DECKS } from './cards';

export default class DeckList extends React.Component {
  constructor(props) {
    super(props);

    this.globalLevelSelector = React.createRef();
    this.levelSelectors = {};
    this.state = { checked: new Set() };
    for (const { name } of Object.values(DECKS)) {
      this.levelSelectors[name] = React.createRef();
    }

    this.handleCheckedChange = this.handleCheckedChange.bind(this);
    this.handleGlobalApplyClick = this.handleGlobalApplyClick.bind(this);
  }

  get_selected_decks() {
    const result = [];
    for (const name of this.state.checked) {
      const deck = DECKS[name];
      deck.level = this.levelSelectors[name].current.get_selection();
      result.push(deck);
    }
    return result;
  }

  set_selection(selected_deck_names) {
    for (const deck_names of selected_deck_names) {
      this.levelSelectors[deck_names.name].current.set_value(deck_names.level);
    }
    this.setState({ checked: new Set(selected_deck_names.map(d => d.name)) });
  }

  handleCheckedChange(event) {
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

  handleGlobalApplyClick() {
    for (const selector of Object.values(this.levelSelectors)) {
      selector.current.set_value(this.globalLevelSelector.current.get_selection());
    }
  }

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
        <LevelSelector inline text=" with level " ref={this.levelSelectors[name]} />
      </li>
    ));
    return (
      <ul className="selectionlist">
        <li>
          <LevelSelector inline text="Select global level" ref={this.globalLevelSelector} />
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

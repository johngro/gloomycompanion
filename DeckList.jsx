import React from 'react';

import LevelSelector from './LevelSelector';
import { DECKS } from './cards';

export default class DeckList extends React.Component {
  constructor(props) {
    super(props);

    this.globalLevelSelector = React.createRef();
    this.levelSelectors = {};
    this.checkboxes = {};
    for (const { name } of Object.values(DECKS)) {
      this.checkboxes[name] = React.createRef();
      this.levelSelectors[name] = React.createRef();
    }

    this.handleGlobalApplyClick = this.handleGlobalApplyClick.bind(this);
  }

  get_selection() {
    return Object
      .entries(this.checkboxes)
      .filter(([, ref]) => ref.current.checked)
      .map(([name]) => name);
  }

  get_selected_decks() {
    const result = [];
    for (const name of this.get_selection()) {
      const deck = DECKS[name];
      deck.level = this.levelSelectors[name].current.get_selection();
      result.push(deck);
    }
    return result;
  }

  set_selection(selected_deck_names) {
    for (const ref of Object.values(this.checkboxes)) {
      ref.current.checked = false;
    }
    for (const deck_names of selected_deck_names) {
      const checkbox = this.checkboxes[deck_names.name];
      if (checkbox) {
        checkbox.current.checked = true;
        this.levelSelectors[deck_names.name].current.set_value(deck_names.level);
      }
    }
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
          <input name="deck" type="checkbox" value={name} ref={this.checkboxes[name]} />
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

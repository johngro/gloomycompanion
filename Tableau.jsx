import PropTypes from 'prop-types';
import React from 'react';

import AbilityDeck from './AbilityDeck';

export default class Tableau extends React.Component {
  // FIXME: Decks with same class should be synchronized
  // FIXME: Deck visibility buttons

  constructor(props) {
    super(props);
    this.deckRefs = {};
  }

  render() {
    const decks = this.props.selected_deck_names.map((deck_names) => {
      const realName = deck_names.name ? deck_names.name : deck_names.class;
      const deckid = realName.replace(/\s+/g, '');
      if (!(deckid in this.deckRefs)) {
        this.deckRefs[deckid] = React.createRef();
      }

      return (
        <AbilityDeck
          id={deckid}
          key={deckid}
          deckClass={deck_names.class}
          deckName={deck_names.name}
          level={deck_names.level}
          ref={this.deckRefs[deckid]}
        />
      );
    });
    return (
      <React.Fragment>
        <div id="modifier-container-container" />
        {decks}
      </React.Fragment>
    );
  }
}

Tableau.propTypes = {
  selected_deck_names: PropTypes.arrayOf(PropTypes.object).isRequired,
};

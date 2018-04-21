import React from 'react';
import ReactDOM from 'react-dom';

import SettingsPane from './SettingsPane';
import Tableau from './Tableau';
import firebase, { useFirebase } from './firebase';

import * as css from './style/Card.scss';

// Import global styles for side effects
import './cards.css';
import './style.css';

// TODO Adding an extra Guard deck will reshuffle the first one, End of round with multiple Archers, resize text, worth to show common and elite_only attributes?, shield and retaliate only when shown (apparently, attribtues are active at the beginning of the turn, and active after initiative)
const visible_ability_decks = [];

// This should be dynamic dependant on lines per card
function refresh_ui() {
  const actual_card_height = 296;
  const base_font_size = 26.6;

  const tableau = document.getElementById('tableau');
  const cards = tableau.getElementsByClassName(css.card);
  for (let i = 1; i < cards.length; i += 1) {
    if (cards[i].className.indexOf(css.ability) !== -1) {
      const scale = cards[i].getBoundingClientRect().height / actual_card_height;
      const scaled_font_size = base_font_size * scale;

      const font_pixel_size = Math.min(scaled_font_size, base_font_size);
      tableau.style.fontSize = `${font_pixel_size}px`;
      break;
    }
  }
}

function render_tableau(selected_deck_names, preserve) {
  const tableauContainer = document.getElementById('tableau');

  const renderTableau = () => {
    // Render tableau (or update props)
    const deckSpecs = selected_deck_names.map(d => ({
      id: (d.name || d.class).replace(/\s+/g, ''),
      name: d.name || d.class,
      class: d.class,
      level: d.level,
    }));
    ReactDOM.render(
      React.createElement(Tableau, { deckSpecs, useFirebase }),
      tableauContainer,
    );

    // Rescale card text if necessary
    refresh_ui();
  };

  // If not preserving state, totally nuke the old tableau
  if (!preserve) {
    ReactDOM.unmountComponentAtNode(tableauContainer);
    if (useFirebase) {
      return firebase.database().ref().remove(renderTableau);
    }
    return Promise.resolve(renderTableau());
  }

  return Promise.resolve(renderTableau());
}

export function init() {
  const doRender = (selected_deck_names, showModifierDeck, preserve) => {
    render_tableau(selected_deck_names, preserve).then(() => {
      const modifier_deck_section = document.getElementById('modifier-container');
      modifier_deck_section.style.display = showModifierDeck ? 'block' : 'none';
    });
  };

  let selectedDecksRef;
  if (useFirebase) {
    selectedDecksRef = firebase.database().ref('selected_decks');
    selectedDecksRef.on('value', (snapshot) => {
      // Always preserve, because we handle nuking the old state in onSelectDecks
      const preserve = true;
      // TODO: fix showModifierDeck
      doRender(snapshot.val() || [], true, preserve);
    });
  }

  ReactDOM.render(
    React.createElement(SettingsPane, {
      onSelectDecks: (selected_deck_names, showModifierDeck, preserve) => {
        console.log(`oSD(..., ${showModifierDeck}, ${preserve})`);
        if (useFirebase) {
          let future = Promise.resolve(null);
          if (!preserve) {
            future = firebase.database().ref().remove();
          }
          future.then(() => selectedDecksRef.set(selected_deck_names));
        } else {
          doRender(selected_deck_names, showModifierDeck, preserve);
        }
      },
    }),
    document.getElementById('panecontainer'),
  );

  window.onresize = refresh_ui.bind(null, visible_ability_decks);
}

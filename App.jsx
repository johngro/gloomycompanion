import React from 'react';
import { hot } from 'react-hot-loader';

import SettingsPane, { SettingsButton } from './SettingsPane';
import Tableau from './Tableau';
import firebase, { useFirebase } from './firebase';

import * as css from './style/Card.scss';

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

class App extends React.Component {
  state = {
    deckSpecs: [],
    modDeckHidden: true,
    settingsVisible: true,
  }

  componentDidMount() {
    if (useFirebase) {
      this.selectedDecksRef = firebase.database().ref('selected_decks');
      this.selectedDecksRef.on('value', this.onSelectedDecksChange, this);
      this.modDeckHiddenRef = firebase.database().ref('mod_deck_hidden');
      this.modDeckHiddenRef.on('value', this.onModDeckHiddenChange, this);
    }
    refresh_ui();
    window.addEventListener('resize', refresh_ui);
  }

  componentWillUnmount() {
    if (useFirebase) {
      this.selectedDecksRef.off('value', this.onSelectedDecksChange, this);
      this.modDeckHiddenRef.off('value', this.onModDeckHiddenChange, this);
    }
    window.removeEventListener('resize', refresh_ui);
  }

  onModDeckHiddenChange(snapshot) {
    let modDeckHidden = snapshot.val();
    if (typeof modDeckHidden !== 'boolean') {
      modDeckHidden = true;
    }
    this.setState({ modDeckHidden });
  }

  onSelectedDecksChange(snapshot) {
    this.setState({ deckSpecs: snapshot.val() || [] });
  }

  settingsBtnContainer = React.createRef();
  tableau = React.createRef();

  handleSelectDecks = (deckSpecs, showModifierDeck, preserve) => {
    if (useFirebase) {
      let future = Promise.resolve(null);
      if (!preserve) {
        future = firebase.database().ref().remove();
      }
      future
        .then(() => this.selectedDecksRef.set(deckSpecs))
        .then(() => this.modDeckHiddenRef.set(!showModifierDeck));
    } else {
      this.setState({
        deckSpecs,
        modDeckHidden: !showModifierDeck,
      });
      if (!preserve) {
        this.tableau.current.reset();
      }
    }
  }

  handleSettingsHide = () => this.setState({ settingsVisible: false });
  handleSettingsShow = () => this.setState({ settingsVisible: true });

  render() {
    return (
      <React.StrictMode>
        <SettingsPane
          onHide={this.handleSettingsHide}
          onSelectDecks={this.handleSelectDecks}
          visible={this.state.settingsVisible}
        />
        <div>
          <div>
            <SettingsButton onClick={this.handleSettingsShow} />
          </div>
          <div id="currentdecks" />
        </div>
        <Tableau
          deckSpecs={this.state.deckSpecs}
          modDeckHidden={this.state.modDeckHidden}
          ref={this.tableau}
          useFirebase={useFirebase}
        />
      </React.StrictMode>
    );
  }
}

export default hot(module)(App);

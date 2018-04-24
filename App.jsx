import PropTypes from 'prop-types';
import React from 'react';
import { hot } from 'react-hot-loader';

import SettingsPane from './SettingsPane';
import Tableau from './Tableau';
import firebase, { useFirebase } from './firebase';

import * as css from './style/Card.scss';
import * as SettingsCss from './style/SettingsPane.scss';
import * as TableauCss from './style/Tableau.scss';

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

function SettingsButton(props) {
  return (
    <input
      alt="Configure"
      id={SettingsCss.settingsButton}
      type="image"
      src="images/settings.svg"
      onClick={props.onClick}
    />
  );
}

SettingsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

function VisibilityMenu(props) {
  const entries = props.deckSpecs.map(spec => (
    <li className={TableauCss.currentDeck} key={spec.id}>
      <a
        href={`#switch-${spec.id}`}
        onClick={() => props.onToggleVisibility(spec.id)}
      >
        {spec.name}
      </a>
    </li>
  ));
  return <ul className="currentdeckslist">{entries}</ul>;
}

VisibilityMenu.propTypes = {
  deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
};


class App extends React.Component {
  state = {
    deckSpecs: [],
    deckVisible: {},
    modDeckHidden: true,
    settingsVisible: true,
  }

  componentDidMount() {
    if (useFirebase) {
      this.deckVisibleRef = firebase.database().ref('deck_visible');
      this.deckVisibleRef.on('value', this.onDeckVisibleChange, this);
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
      this.deckVisibleRef.off('value', this.onDeckVisibleChange, this);
      this.selectedDecksRef.off('value', this.onSelectedDecksChange, this);
      this.modDeckHiddenRef.off('value', this.onModDeckHiddenChange, this);
    }
    window.removeEventListener('resize', refresh_ui);
  }

  onDeckVisibleChange(snapshot) {
    this.setState({ deckVisible: snapshot.val() || {} });
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

  handleDeckVisibilityToggle = (deckId) => {
    const mutation = deckVis => ({ ...deckVis, [deckId]: !deckVis[deckId] });
    if (useFirebase) {
      this.deckVisibleRef.set(mutation(this.state.deckVisible));
    } else {
      this.setState(({ deckVisible }) => ({
        deckVisible: mutation(deckVisible),
      }));
    }
  }

  handleSelectDecks = (deckSpecs, showModifierDeck, preserve) => {
    const deckVisible = {};
    for (const { id } of deckSpecs) {
      deckVisible[id] = id in this.state.deckVisible ? this.state.deckVisible[id] : true;
    }
    if (useFirebase) {
      let future = Promise.resolve(null);
      if (!preserve) {
        future = firebase.database().ref().remove();
      }
      future
        .then(() => this.deckVisibleRef.set(deckVisible))
        .then(() => this.selectedDecksRef.set(deckSpecs))
        .then(() => this.modDeckHiddenRef.set(!showModifierDeck));
    } else {
      this.setState({
        deckSpecs,
        deckVisible,
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
          <SettingsButton onClick={this.handleSettingsShow} />
          <VisibilityMenu
            deckSpecs={this.state.deckSpecs}
            onToggleVisibility={this.handleDeckVisibilityToggle}
          />
        </div>
        <Tableau
          deckSpecs={this.state.deckSpecs}
          deckVisible={this.state.deckVisible}
          modDeckHidden={this.state.modDeckHidden}
          ref={this.tableau}
          useFirebase={useFirebase}
        />
      </React.StrictMode>
    );
  }
}

export default hot(module)(App);

import PropTypes from 'prop-types';
import React from 'react';

import ButtonDiv from './ButtonDiv';
import SettingsPane from './SettingsPane';
import Tableau from './Tableau';
import { storageValueProp, withStorage } from './storage';

import * as SettingsCss from './style/SettingsPane.scss';
import * as TableauCss from './style/Tableau.scss';

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
      <ButtonDiv
        className={TableauCss.button}
        onClick={() => props.onToggleVisibility(spec.id)}
      >
        {spec.name}
      </ButtonDiv>
    </li>
  ));
  return <ul className="currentdeckslist">{entries}</ul>;
}

VisibilityMenu.propTypes = {
  deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
};

class MainUI extends React.Component {
  static propTypes = {
    deckSpecs: storageValueProp(PropTypes.array).isRequired,
    deckVisible: storageValueProp(PropTypes.object).isRequired,
    modDeckHidden: storageValueProp(PropTypes.bool).isRequired,
  }

  state = { settingsVisible: true }

  tableau = React.createRef();

  handleDeckVisibilityToggle = (deckId) => {
    const mutation = deckVis => ({ ...deckVis, [deckId]: !deckVis[deckId] });
    this.props.deckVisible.mutate(mutation);
  }

  handleSelectDecks = (deckSpecs, showModifierDeck, preserve) => {
    if (!preserve) {
      this.tableau.current.reset();
    }
    this.props.modDeckHidden.mutate(() => !showModifierDeck);
    this.props.deckSpecs.mutate(() => deckSpecs);
    this.props.deckVisible.mutate((old) => {
      const deckVisible = {};
      for (const { id } of deckSpecs) {
        deckVisible[id] = id in old ? old[id] : true;
      }
      return deckVisible;
    });
  }

  handleSettingsHide = () => this.setState({ settingsVisible: false });
  handleSettingsShow = () => this.setState({ settingsVisible: true });

  render() {
    return (
      <React.Fragment>
        <SettingsPane
          onHide={this.handleSettingsHide}
          onSelectDecks={this.handleSelectDecks}
          visible={this.state.settingsVisible}
        />
        <div>
          <SettingsButton onClick={this.handleSettingsShow} />
          <VisibilityMenu
            deckSpecs={this.props.deckSpecs.value}
            onToggleVisibility={this.handleDeckVisibilityToggle}
          />
        </div>
        <Tableau
          deckSpecs={this.props.deckSpecs.value}
          deckVisible={this.props.deckVisible.value}
          modDeckHidden={this.props.modDeckHidden.value}
          ref={this.tableau}
        />
      </React.Fragment>
    );
  }
}

export default withStorage(MainUI, {
  deckSpecs: {
    path: 'selected_decks',
    deserialize: value => value || [],
  },
  deckVisible: {
    path: 'deck_visible',
    deserialize: value => value || {},
  },
  modDeckHidden: {
    path: 'mod_deck_hidden',
    deserialize: value => (typeof value === 'boolean' ? value : true),
  },
});

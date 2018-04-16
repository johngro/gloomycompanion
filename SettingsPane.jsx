import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import DeckList from './DeckList';
import ScenarioList from './ScenarioList';

export default class SettingsPane extends React.Component {
  static propTypes = {
    onSelectDecks: PropTypes.func.isRequired,
    loadFromStorage: PropTypes.func.isRequired,
  }

  state = {
    visible: true,
    activeTab: 'scenarios',
    showModifierDeck: true,
  }

  deckList = React.createRef();
  scenarioList = React.createRef();

  pageClass(tab) {
    return `tabbody${tab === this.state.activeTab ? '' : ' inactive'}`;
  }

  tabClass(tab) {
    return tab === this.state.activeTab ? null : 'inactive';
  }

  handleApplyDecks = () => {
    const selectedDecks = this.deckList.current.get_selected_decks();
    this.props.onSelectDecks(selectedDecks, this.state.showModifierDeck, true);
  }

  handleApplyLoad = () => {
    const selectedDecks = this.props.loadFromStorage();
    this.deckList.current.set_selection(selectedDecks);
    this.props.onSelectDecks(selectedDecks, this.state.showModifierDeck, true);
  }

  handleApplyScenario = () => {
    const selectedDecks = this.scenarioList.current.get_scenario_decks();
    this.deckList.current.set_selection(selectedDecks);
    this.props.onSelectDecks(selectedDecks, this.state.showModifierDeck, false);
  }

  handleHideSettings = () => this.setState({ visible: false })

  handleShowSettings = () => this.setState({ visible: true })

  handleShowModifierChanged = e => this.setState({ showModifierDeck: e.target.checked })

  render() {
    const settingsBtn = (
      <input
        alt="Configure"
        id="settingsbtn"
        type="image"
        src="images/settings.svg"
        onClick={this.handleShowSettings}
      />
    );

    return (
      <React.Fragment>
        <div className={this.state.visible ? 'pane' : 'pane inactive'}>
          <ul className="tabcontainer">
            <li
              className={this.tabClass('scenarios')}
              onClick={() => this.setState({ activeTab: 'scenarios' })}
            >
              Scenario
            </li>
            <li
              className={this.tabClass('decks')}
              onClick={() => this.setState({ activeTab: 'decks' })}
            >
              Decks
            </li>
          </ul>
          <div className={this.pageClass('scenarios')}>
            <ScenarioList ref={this.scenarioList} />
            <label htmlFor="showmodifierdeck">
              <input type="checkbox" checked={this.state.showModifierDeck} onChange={this.handleShowModifierChanged} />Show Monster Modifier Deck
            </label>
            <br />
            <input type="button" value="Apply" onClick={this.handleApplyScenario} />
            <br />
            <input type="button" value="Load Previous Scenario" onClick={this.handleApplyLoad} />
          </div>
          <div className={this.pageClass('decks')}>
            <DeckList ref={this.deckList} />
            <label htmlFor="showmodifierdeck-deckspage">
              <input type="checkbox" checked={this.state.showModifierDeck} onChange={this.handleShowModifierChanged} />Show Monster Modifier Deck
            </label>
            <input type="button" value="Apply" onClick={this.handleApplyDecks} />
          </div>
        </div>
        <div
          id="cancelarea"
          style={{ display: this.state.visible ? 'initial' : 'none' }}
          onClick={this.handleHideSettings}
        />
        {ReactDOM.createPortal(settingsBtn, document.getElementById('settingsbtncontainer'))}
      </React.Fragment>
    );
  }
}

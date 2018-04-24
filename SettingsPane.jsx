import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import ButtonDiv from './ButtonDiv';
import DeckList from './DeckList';
import ScenarioList from './ScenarioList';

import * as css from './style/SettingsPane.scss';

export function SettingsButton(props) {
  return (
    <input
      alt="Configure"
      id={css.settingsButton}
      type="image"
      src="images/settings.svg"
      onClick={props.onClick}
    />
  );
}

SettingsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default class SettingsPane extends React.Component {
  static propTypes = {
    onHide: PropTypes.func.isRequired,
    onSelectDecks: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
  }

  state = {
    activeTab: 'scenarios',
    showModifierDeck: true,
  }

  deckList = React.createRef();
  scenarioList = React.createRef();

  pageClass(tab) {
    return classNames(css.tabBody, { [css.inactive]: tab !== this.state.activeTab });
  }

  tabClass(tab) {
    return classNames({ [css.inactive]: tab !== this.state.activeTab });
  }

  handleApplyDecks = () => {
    const selectedDecks = this.deckList.current.get_selected_decks();
    this.props.onSelectDecks(selectedDecks, this.state.showModifierDeck, true);
  }

  handleApplyScenario = () => {
    const selectedDecks = this.scenarioList.current.get_scenario_decks();
    this.deckList.current.set_selection(selectedDecks);
    this.props.onSelectDecks(selectedDecks, this.state.showModifierDeck, false);
  }

  handleShowModifierChanged = e => this.setState({ showModifierDeck: e.target.checked })

  render() {
    const renderTab = (name, text) => {
      const onClick = () => this.setState({ activeTab: name });
      return (
        <li
          className={this.tabClass(name)}
          onClick={onClick}
          onKeyPress={(e) => { if (e.key === 'Enter') onClick(); }}
          role="tab"
          tabIndex="0"
        >
          {text}
        </li>
      );
    };

    return (
      <div id="panecontainer" className="panecontainer">
        <div className={classNames(css.pane, { [css.inactive]: !this.props.visible })}>
          <ul className={css.tabContainer} role="tablist">
            {renderTab('scenarios', 'Scenario')}
            {renderTab('decks', 'Decks')}
          </ul>
          <div className={this.pageClass('scenarios')} role="tabpanel">
            <ScenarioList ref={this.scenarioList} />
            <label htmlFor="showmodifierdeck">
              <input type="checkbox" checked={this.state.showModifierDeck} onChange={this.handleShowModifierChanged} />Show Monster Modifier Deck
            </label>
            <br />
            <input type="button" value="Apply" onClick={this.handleApplyScenario} />
            <br />
          </div>
          <div className={this.pageClass('decks')} role="tabpanel">
            <DeckList ref={this.deckList} />
            <label htmlFor="showmodifierdeck-deckspage">
              <input type="checkbox" checked={this.state.showModifierDeck} onChange={this.handleShowModifierChanged} />Show Monster Modifier Deck
            </label>
            <input type="button" value="Apply" onClick={this.handleApplyDecks} />
          </div>
        </div>
        <ButtonDiv
          id={css.cancelArea}
          style={{ display: this.props.visible ? 'initial' : 'none' }}
          onClick={this.props.onHide}
        />
      </div>
    );
  }
}

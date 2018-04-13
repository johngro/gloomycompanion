import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import AbilityDeck from './AbilityDeck';

function VisibilityMenu(props) {
  return ReactDOM.createPortal(props.deckSpecs.map(spec => (
    <li className="currentdeck" key={spec.id}>
      <a
        href={`#switch-${spec.id}`}
        onClick={() => props.onToggleVisibility(spec.id)}
      >
        {spec.name}
      </a>
    </li>
  )), props.target);
}

VisibilityMenu.propTypes = {
  deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onToggleVisibility: PropTypes.func.isRequired,
  target: PropTypes.instanceOf(Element).isRequired,
};

export default class Tableau extends React.Component {
  // FIXME: Decks with same class should be synchronized

  static getDerivedStateFromProps(nextProps, prevState) {
    const deckHidden = {};
    for (const spec of nextProps.deckSpecs) {
      deckHidden[spec.id] = prevState.deckHidden[spec.id] || false;
    }
    return { deckHidden };
  }

  constructor(props) {
    super(props);
    this.deckRefs = {};
    this.state = {
      deckHidden: {},
    };
    this.handleToggleVisibility = this.handleToggleVisibility.bind(this);
  }

  handleToggleVisibility(deckId) {
    this.setState(({ deckHidden }) => ({
      deckHidden: { ...deckHidden, [deckId]: !deckHidden[deckId] },
    }));
  }

  render() {
    const decks = this.props.deckSpecs.map((spec) => {
      if (!(spec.id in this.deckRefs)) {
        this.deckRefs[spec.id] = React.createRef();
      }

      return (
        <AbilityDeck
          id={spec.id}
          key={spec.id}
          deckClass={spec.class}
          deckName={spec.name}
          level={spec.level}
          hidden={this.state.deckHidden[spec.id]}
          ref={this.deckRefs[spec.id]}
        />
      );
    });
    return (
      <React.Fragment>
        <VisibilityMenu
          deckSpecs={this.props.deckSpecs}
          onToggleVisibility={this.handleToggleVisibility}
          target={document.getElementById('currentdeckslist')}
        />
        <div id="modifier-container-container" />
        {decks}
      </React.Fragment>
    );
  }
}

Tableau.propTypes = {
  deckSpecs: PropTypes.arrayOf(PropTypes.object).isRequired,
};

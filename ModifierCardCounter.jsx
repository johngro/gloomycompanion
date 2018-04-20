import PropTypes from 'prop-types';
import React from 'react';

import ButtonDiv from './ButtonDiv';
import ModifierDeckState from './ModifierDeckState';

export default function ModifierCardCounter(props) {
  function count() {
    return props.deckState.num_special[props.modifierType];
  }

  return (
    <div className="counter-icon">
      <div className={`background ${props.modifierType}`} />
      <ButtonDiv className="decrement button" onClick={() => props.removeSpecial(props.modifierType)}>-</ButtonDiv>
      <div className="icon-text">{count()}</div>
      <ButtonDiv className="increment button" onClick={() => props.addSpecial(props.modifierType)}>+</ButtonDiv>
    </div>
  );
}

ModifierCardCounter.propTypes = {
  modifierType: PropTypes.string.isRequired,
  deckState: PropTypes.instanceOf(ModifierDeckState).isRequired,
  addSpecial: PropTypes.func.isRequired,
  removeSpecial: PropTypes.func.isRequired,
};

import PropTypes from 'prop-types';
import React from 'react';

import ButtonDiv from './ButtonDiv';
import ModifierDeckState from './ModifierDeckState';

import * as css from './style/ModifierDeck.scss';

export default function ModifierCardCounter(props) {
  function count() {
    return props.deckState.num_special[props.modifierType];
  }

  return (
    <div className={css.counterIcon}>
      <div className={`${css.background} ${css[props.modifierType]}`} />
      <ButtonDiv className={`${css.decrement} ${css.button}`} onClick={() => props.removeSpecial(props.modifierType)}>-</ButtonDiv>
      <div className={css.iconText}>{count()}</div>
      <ButtonDiv className={`${css.increment} ${css.button}`} onClick={() => props.addSpecial(props.modifierType)}>+</ButtonDiv>
    </div>
  );
}

ModifierCardCounter.propTypes = {
  modifierType: PropTypes.string.isRequired,
  deckState: PropTypes.instanceOf(ModifierDeckState).isRequired,
  addSpecial: PropTypes.func.isRequired,
  removeSpecial: PropTypes.func.isRequired,
};

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import ButtonDiv from './ButtonDiv';
import Card from './Card';
import ModifierCardCounter from './ModifierCardCounter';
import ModifierCardFront from './ModifierCardFront';
import ModifierDeckState from './ModifierDeckState';

import * as CardCss from './style/Card.scss';
import * as css from './style/ModifierDeck.scss';

export default function ModifierDeck(props) {
  const renderCard = (card, zIndex, cardClasses, faceUp) => (
    <Card
      key={card.id}
      classes={cardClasses}
      deckType="modifier"
      faceUp={faceUp}
      zIndex={zIndex}
      renderBack={() => null}
      renderFront={() => (
        <ModifierCardFront image={card.card_image} />
      )}
    />
  );

  const renderDeck = () => {
    const [topDraw] = props.deckState.draw_pile;
    const [topDiscard, sndDiscard, thdDiscard] = props.deckState.discard;

    if (props.deckState.advantage_card == null) {
      return (
        <ButtonDiv className={classNames(CardCss.cardContainer, CardCss.modifier)} onClick={props.onDrawClick}>
          {topDraw ? renderCard(topDraw, -7, [CardCss.draw], false) : null}
          {topDiscard ? renderCard(topDiscard, -3, [CardCss.discard, CardCss.pull], true) : null}
          {sndDiscard ? renderCard(sndDiscard, -4, [CardCss.discard, CardCss.lift], true) : null}
        </ButtonDiv>
      );
    }
    return (
      <ButtonDiv className={classNames(CardCss.cardContainer, CardCss.modifier)} onClick={props.onDrawClick}>
        {topDraw ? renderCard(topDraw, -7, [CardCss.draw], false) : null}
        {renderCard(topDiscard, -3, [CardCss.discard, CardCss.pull, CardCss.right], true)}
        {renderCard(sndDiscard, -3, [CardCss.discard, CardCss.pull, CardCss.left], true)}
        {thdDiscard ? renderCard(thdDiscard, -4, [CardCss.discard, CardCss.lift], true) : null}
      </ButtonDiv>
    );
  };

  const shuffleIndicator = (needsShuffled) => {
    const classes = classNames(css.counterIcon, css.shuffle, {
      [css.notRequired]: !needsShuffled,
    });
    return <ButtonDiv className={classes} onClick={props.onEndRoundClick} />;
  };

  const style = { display: props.hidden ? 'none' : 'block' };

  return (
    <div className={CardCss.cardContainer} style={style}>
      <div className={css.modifierDeckColumn2}>
        {renderDeck()}
        <ButtonDiv className={`${css.button} ${css.drawTwo}`} onClick={props.onDoubleDrawClick} />
      </div>
      <div className={css.modifierDeckColumn1}>
        <ModifierCardCounter
          deckState={props.deckState}
          modifierType="bless"
          addSpecial={props.onAddSpecialClick}
          removeSpecial={props.onRemoveSpecialClick}
        />
        <ModifierCardCounter
          deckState={props.deckState}
          modifierType="curse"
          addSpecial={props.onAddSpecialClick}
          removeSpecial={props.onRemoveSpecialClick}
        />
        {shuffleIndicator(props.deckState.needs_shuffled)}
      </div>
    </div>
  );
}

ModifierDeck.propTypes = {
  deckState: PropTypes.instanceOf(ModifierDeckState).isRequired,
  hidden: PropTypes.bool.isRequired,
  onDrawClick: PropTypes.func.isRequired,
  onDoubleDrawClick: PropTypes.func.isRequired,
  onEndRoundClick: PropTypes.func.isRequired,
  onAddSpecialClick: PropTypes.func.isRequired,
  onRemoveSpecialClick: PropTypes.func.isRequired,
};

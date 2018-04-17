import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';

import { CARD_TYPES_MODIFIER, MODIFIER_CARDS, MODIFIER_DECK } from './modifiers';
import { get_from_storage, remove_child, shuffle_list, write_to_storage } from './util';

import Card from './Card';
import ModifierCardFront from './ModifierCardFront';
import SettingsPane from './SettingsPane';
import Tableau from './Tableau';

import * as css from './style/Card.scss';

// Import global styles for side effects
import './cards.css';
import './style.css';

// TODO Adding an extra Guard deck will reshuffle the first one, End of round with multiple Archers, resize text, worth to show common and elite_only attributes?, shield and retaliate only when shown (apparently, attribtues are active at the beginning of the turn, and active after initiative)
const visible_ability_decks = [];
let modifier_deck = null;

const DECK_TYPES =
    {
      MODIFIER: 'modifier',
      ABILITY: 'ability',
      BOSS: 'boss',
    };

const EVENT_NAMES = {
  MODIFIER_CARD_DRAWN: 'modifierCardDrawn',
  MODIFIER_DECK_SHUFFLE_REQUIRED: 'modfierDeckShuffleRequired',
};

function place_deck(deck, container) {
  for (let i = 0; i < deck.draw_pile.length; i += 1) {
    const card = deck.draw_pile[i];
    container.appendChild(card.domNode);
  }
  for (let i = 0; i < deck.discard.length; i += 1) {
    const card = deck.discard[i];
    container.appendChild(card.domNode);
  }
  deck.deck_space = container;
}

function force_repaint_deck(deck) {
  prevent_pull_animation(deck);
  const space = deck.deck_space;
  remove_child(space);
  place_deck(deck, space);
}

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

function reshuffle(deck, include_discards) {
  shuffle_deck(deck, include_discards);

  // This way we keep sync several decks from the same class
  visible_ability_decks.forEach((visible_deck) => {
    if ((visible_deck !== deck) && (visible_deck.class == deck.class)) {
      shuffle_deck(visible_deck, include_discards);
      visible_deck.set_card_piles(deck.draw_pile, deck.discard);
    }
  });
}

function shuffle_deck(deck, include_discards) {
  if (include_discards) {
    deck.draw_pile = deck.draw_pile.concat(deck.discard);
    deck.discard = [];
  }

  shuffle_list(deck.draw_pile);

  for (let i = 0; i < deck.draw_pile.length; i += 1) {
    const card = deck.draw_pile[i];

    card.ui.removeClass(css.lift);
    card.ui.removeClass(css.pull);

    card.ui.flip_up(false);

    card.ui.removeClass(css.discard);
    card.ui.addClass(css.draw);

    card.ui.set_depth(-i - 6);
  }
}

function flip_up_top_card(deck) {
  for (let i = 0; i < deck.discard.length; i += 1) {
    const card = deck.discard[i];
    card.ui.removeClass(css.lift);
    card.ui.removeClass(css.pull);
    card.ui.push_down();
  }

  if (deck.discard.length > 0) {
    deck.discard[0].ui.addClass(css.lift);
  }

  const card = deck.draw_pile.shift();
  send_to_discard(card, true);
  deck.discard.unshift(card);
}

function send_to_discard(card, pull_animation) {
  card.ui.set_depth(-3);

  if (pull_animation) {
    card.ui.addClass(css.pull);
  }

  card.ui.flip_up(true);

  card.ui.removeClass(css.draw);
  card.ui.addClass(css.discard);
}

function prevent_pull_animation(deck) {
  if (deck.discard.length) {
    if (deck.discard[1]) {
      deck.discard[1].ui.removeClass(css.lift);
      deck.discard[0].ui.addClass(css.lift);
    }

    deck.discard[0].ui.removeClass(css.pull);
  }
}

function reshuffle_modifier_deck(deck) {
  deck.clean_discard_pile();
  reshuffle(deck, true);
  document.body.dispatchEvent(new CustomEvent(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, { detail: { shuffle: false } }));
}

function draw_modifier_card(deck) {
  deck.clean_advantage_deck();

  if (deck.must_reshuffle()) {
    reshuffle_modifier_deck(deck);
  } else {
    flip_up_top_card(deck);

    document.body.dispatchEvent(new CustomEvent(
      EVENT_NAMES.MODIFIER_CARD_DRAWN,
      {
        detail: {
          card_type: deck.discard[0].card_type,
          count: deck.count(deck.discard[0].card_type),
        },
      },
    ));

    if (deck.shuffle_end_of_round()) {
      document.body.dispatchEvent(new CustomEvent(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, { detail: { shuffle: true } }));
    }
  }
  write_to_storage('modifier_deck', JSON.stringify(deck));
}

function double_draw(deck) {
  let advantage_card;
  // Case there was 1 card in draw_pile when we clicked "draw 2".
  //    now we should draw, save that card, reshuffle, and
  //    draw the next
  if (deck.draw_pile.length == 1) {
    draw_modifier_card(deck);
    advantage_card = deck.discard[0];
    reshuffle_modifier_deck(deck);
    advantage_card = deck.draw_pile.shift(advantage_card);
    send_to_discard(advantage_card, false);
    deck.discard.unshift(advantage_card);
    draw_modifier_card(deck);
    // Case there were 0 cards in draw_pile when we clicked "draw 2".
    //    we should reshuffle, draw 1 and send it to advantage_place,
    //    draw the next
  } else if (deck.draw_pile.length == 0) {
    // This is in case the previous draw was double as well
    deck.clean_advantage_deck();
    reshuffle_modifier_deck(deck);
    draw_modifier_card(deck);
    advantage_card = deck.discard[0];
    draw_modifier_card(deck);
    // Every other simple case
  } else {
    draw_modifier_card(deck);
    advantage_card = deck.discard[0];
    draw_modifier_card(deck);
  }
  deck.discard[0].ui.addClass(css.right);
  advantage_card.ui.addClass(css.left);
  deck.advantage_to_clean = true;
}

class ModifierDeck {
  constructor() {
    this.name = 'Monster modifier deck';
    this.type = DECK_TYPES.MODIFIER;
    this.draw_pile = [];
    this.discard = [];
    this.advantage_to_clean = false;

    // FIXME: Not clearly necessary
    this.count = this.count.bind(this);
    this.remove_card = this.remove_card.bind(this);
    this.add_card = this.add_card.bind(this);
    this.shuffle_end_of_round = this.shuffle_end_of_round.bind(this);
    this.must_reshuffle = this.must_reshuffle.bind(this);
    this.clean_discard_pile = this.clean_discard_pile.bind(this);

    const loaded_deck = JSON.parse(get_from_storage('modifier_deck'));

    MODIFIER_DECK.forEach((card_definition) => {
      const card = define_modifier_card(card_definition);
      if (loaded_deck && find_in_discard_and_remove(loaded_deck.discard, card.card_type)) {
        this.discard.push(card);
      } else {
        this.draw_pile.push(card);
      }
    });
  }

  draw_top_discard() {
    if (this.discard.length > 0) {
      const card = this.discard[this.discard.length - 1];
      card.ui.set_depth(-3);
      card.ui.addClass(css.pull);
      card.ui.flip_up(true);
      card.ui.removeClass(css.draw);
      card.ui.addClass(css.discard);
    }
    force_repaint_deck(this);
  }

  count(card_type) {
    return (this.draw_pile.filter(card => card.card_type === card_type).length);
  }

  remove_card(card_type) {
    for (let i = 0; i < this.draw_pile.length; i += 1) {
      if (this.draw_pile[i].card_type == card_type) {
        this.draw_pile.splice(i, 1);
        reshuffle(this, false);

        force_repaint_deck(this);
        break;
      }
    }
    write_to_storage('modifier_deck', JSON.stringify(modifier_deck));

    return this.count(card_type);
  }

  add_card(card_type) {
    // Rulebook p. 23: "a maximum of only 10 curse [and 10 bless] cards can be placed into any one deck"
    if (this.count(card_type) < 10) {
      // TOOD: Brittle
      this.draw_pile.push(define_modifier_card(MODIFIER_CARDS[card_type.toUpperCase()]));

      force_repaint_deck(this);
      reshuffle(this, false);
    }
    write_to_storage('modifier_deck', JSON.stringify(modifier_deck));

    return this.count(card_type);
  }

  shuffle_end_of_round() {
    return this.discard.filter(card => card.shuffle_next_round).length > 0;
  }

  must_reshuffle() {
    return !this.draw_pile.length;
  }

  clean_discard_pile() {
    for (let i = 0; i < this.discard.length; i += 1) {
      if (this.discard[i].card_type == CARD_TYPES_MODIFIER.BLESS
                || this.discard[i].card_type == CARD_TYPES_MODIFIER.CURSE) {
        // Delete this curse/bless that has been used
        this.discard.splice(i, 1);
        i -= 1;
      }
    }

    // This is needed every time we update
    force_repaint_deck(this);
  }

  clean_advantage_deck() {
    if ((this.advantage_to_clean) && this.discard[1]) {
      this.advantage_to_clean = false;
      this.discard[0].ui.removeClass('right');
      this.discard[0].ui.removeClass('left');
      this.discard[1].ui.removeClass('left');
      this.discard[1].ui.removeClass('left');
    }
  }
}

function find_in_discard_and_remove(discard, card_type) {
  for (let i = 0; i < discard.length; i += 1) {
    if (discard[i].card_type === card_type) {
      return discard.splice(i, 1);
    }
  }
  return null;
}

function define_modifier_card(card_definition) {
  const card = {
    domNode: document.createElement('div'),
    card_type: card_definition.type,
    shuffle_next_round: card_definition.shuffle,
    toJSON: () => ({
      card_type: card.card_type,
      shuffle_next_round: card.shuffle_next_round,
    }),
  };

  const element = React.createElement(Card, {
    deckType: 'modifier',
    renderBack: () => null,
    renderFront: () => React.createElement(ModifierCardFront, {
      image: card_definition.image,
    }),
  });

  card.ui = ReactDOM.render(element, card.domNode);
  return card;
}

function end_round() {
  if (modifier_deck.shuffle_end_of_round()) {
    modifier_deck.clean_advantage_deck();
    reshuffle_modifier_deck(modifier_deck);
  }
  write_to_storage('modifier_deck', JSON.stringify(modifier_deck));
}

function render_tableau(selected_deck_names, preserve) {
  const tableauContainer = document.getElementById('tableau');

  // If not preserving state, totally nuke the old tableau
  if (!preserve) {
    ReactDOM.unmountComponentAtNode(tableauContainer);
  }

  // Render tableau (or update props)
  const deckSpecs = selected_deck_names.map(d => ({
    id: (d.name || d.class).replace(/\s+/g, ''),
    name: d.name || d.class,
    class: d.class,
    level: d.level,
  }));
  ReactDOM.render(
    React.createElement(Tableau, { deckSpecs }),
    tableauContainer,
  );

  // Inject non-Reactified modifier deck
  if (!preserve || !modifier_deck) {
    const mcc = document.getElementById('modifier-container-container');
    init_modifier_deck();
    add_modifier_deck(mcc, modifier_deck, false);
    if (preserve) {
      const loaded_modifier_deck = JSON.parse(get_from_storage('modifier_deck'));
      const curses = count_type('curse', loaded_modifier_deck);
      const blessings = count_type('bless', loaded_modifier_deck);
      for (let i = 0; i < curses; i += 1) {
        modifier_deck.add_card('bless');
      }
      for (let i = 0; i < blessings; i += 1) {
        modifier_deck.add_card('curse');
      }
      modifier_deck.draw_top_discard();

      document.body.dispatchEvent(new CustomEvent(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, { detail: { shuffle: modifier_deck.shuffle_end_of_round() } }));
    }
  }
  write_to_storage('modifier_deck', JSON.stringify(modifier_deck));

  // Rescale card text if necessary
  refresh_ui();
}

function init_modifier_deck() {
  modifier_deck = new ModifierDeck();
}

function count_type(type, deck) {
  let count = 0;
  if (deck) {
    for (let i = 0; i < deck.draw_pile.length; i += 1) {
      if (deck.draw_pile[i].card_type === type) {
        count += 1;
      }
    }
  }
  return count;
}

function add_modifier_deck(container, deck, preserve_discards) {
  function create_counter(card_type, increment_func, decrement_func) {
    function create_button(class_name, text, func, text_element) {
      const button = document.createElement('div');
      button.className = `${class_name} button`;
      button.innerText = text;

      button.onclick = function () {
        text_element.innerText = func(card_type);
      };

      return button;
    }

    const widget_container = document.createElement('div');
    widget_container.className = 'counter-icon';

    const background = document.createElement('div');
    background.className = `background ${card_type}`;
    widget_container.appendChild(background);

    const text_element = document.createElement('div');
    text_element.className = 'icon-text';
    text_element.innerText = '0';

    widget_container.appendChild(create_button('decrement', '-', decrement_func, text_element));
    widget_container.appendChild(text_element);
    widget_container.appendChild(create_button('increment', '+', increment_func, text_element));

    document.body.addEventListener(EVENT_NAMES.MODIFIER_CARD_DRAWN, (e) => {
      if (e.detail.card_type === card_type) {
        text_element.innerText = e.detail.count;
      }
    });

    return widget_container;
  }

  const modifier_container = document.createElement('div');
  modifier_container.className = css.cardContainer;
  modifier_container.id = 'modifier-container';

  const button_div = document.createElement('div');
  button_div.className = 'modifier-deck-column-1';

  button_div.appendChild(create_counter('bless', deck.add_card, deck.remove_card));
  button_div.appendChild(create_counter('curse', deck.add_card, deck.remove_card));

  const end_round_div = document.createElement('div');
  end_round_div.className = 'counter-icon shuffle not-required';
  end_round_div.onclick = end_round;

  function indicate_shuffle_required(e) {
    if (e.detail.shuffle) {
      window.setTimeout(() => { end_round_div.className = 'counter-icon shuffle'; }, 400);
    } else {
      end_round_div.className = 'counter-icon shuffle not-required';
    }
  }

  document.body.addEventListener(EVENT_NAMES.MODIFIER_DECK_SHUFFLE_REQUIRED, indicate_shuffle_required);

  button_div.appendChild(end_round_div);

  const deck_column = document.createElement('div');
  deck_column.className = 'modifier-deck-column-2';

  const deck_space = document.createElement('div');
  deck_space.className = classNames(css.cardContainer, css.modifier);

  const draw_two_button = document.createElement('div');
  draw_two_button.className = 'button draw-two';
  draw_two_button.onclick = double_draw.bind(null, modifier_deck);

  deck_column.appendChild(deck_space);
  deck_column.appendChild(draw_two_button);

  modifier_container.appendChild(deck_column);
  modifier_container.appendChild(button_div);

  container.appendChild(modifier_container);

  place_deck(deck, deck_space);
  reshuffle(deck, !preserve_discards);
  deck_space.onclick = draw_modifier_card.bind(null, deck);
}

export function init() {
  ReactDOM.render(
    React.createElement(SettingsPane, {
      onSelectDecks: (selected_deck_names, showModifierDeck, preserve) => {
        console.log(`oSD(..., ${showModifierDeck}, ${preserve})`);
        localStorage.clear();
        write_to_storage('selected_deck_names', JSON.stringify(selected_deck_names));
        render_tableau(selected_deck_names, preserve);
        const modifier_deck_section = document.getElementById('modifier-container');
        modifier_deck_section.style.display = showModifierDeck ? 'block' : 'none';
      },
      loadFromStorage: () => JSON.parse(get_from_storage('selected_deck_names')),
    }),
    document.getElementById('panecontainer'),
  );

  window.onresize = refresh_ui.bind(null, visible_ability_decks);
}

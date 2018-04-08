import React from 'react';
import ReactDOM from 'react-dom';

import { DECK_DEFINITONS, DECKS } from './cards';
import { attributes_to_lines, immunities_to_lines, notes_to_lines, special_to_lines } from './macros';
import { CARD_TYPES_MODIFIER, MODIFIER_CARDS, MODIFIER_DECK } from './modifiers';
import { MONSTER_STATS } from './monster_stats';
import { SCENARIO_DEFINITIONS, SPECIAL_RULES } from './scenarios';
import { create_input, find_in_discard, get_from_storage, remove_child, shuffle_list, write_to_storage } from './util';

import AbilityCardBack from './AbilityCardBack';
import AbilityCardFront from './AbilityCardFront';
import Card from './Card';
import DeckList from './DeckList';
import LevelSelector from './LevelSelector';
import ModifierCardFront from './ModifierCardFront';

// TODO Adding an extra Guard deck will reshuffle the first one, End of round with multiple Archers, resize text, worth to show common and elite_only attributes?, shield and retaliate only when shown (apparently, attribtues are active at the beginning of the turn, and active after initiative)
const do_shuffles = true;
const visible_ability_decks = [];
let modifier_deck = null;
const deck_definitions = load_definition(DECK_DEFINITONS);

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

class AbilityDeck {
  constructor(deck_class, deck_name, level) {
    const deck_definition = deck_definitions[deck_class];
    deck_definition.name = deck_name;
    deck_definition.level = level;

    const loaded_deck = JSON.parse(get_from_storage(deck_name));

    this.class = deck_definition.class;
    this.name = deck_definition.name;
    this.type = DECK_TYPES.ABILITY;
    this.draw_pile = [];
    this.discard = [];
    this.move = [0, 0];
    this.attack = [0, 0];
    this.range = [0, 0];
    this.level = deck_definition.level;
    this.health = [0, 0];

    for (let i = 0; i < deck_definition.cards.length; i += 1) {
      const definition = deck_definition.cards[i];
      const shuffle = definition[0];
      const initiative = definition[1];
      const lines = definition.slice(2);

      const card = {
        id: `${this.name}_${i}`,
        domNode: document.createElement('div'),
        shuffle_next: shuffle,
        initiative,
        starting_lines: lines,
        // FIXME: Clean this up
        toJSON: () => ({
          id: card.id,
          shuffle_next: card.shuffle_next,
          initiative: card.initiative,
          starting_lines: card.starting_lines,
        }),
      };

      const doRender = (renderFront) => {
        const element = React.createElement(Card, {
          deckType: 'ability',
          renderBack: () => React.createElement(AbilityCardBack, {
            name: this.name,
            level: this.level,
          }),
          renderFront,
        });

        card.ui = ReactDOM.render(element, card.domNode);
      };
      doRender(() => null);

      card.paint_front_card = (name, lines, attack, move, range, level, health) => {
        doRender(() => React.createElement(AbilityCardFront, {
          initiative: card.initiative,
          name,
          shuffle: card.shuffle_next,
          lines,
          attack,
          move,
          range,
          level,
          health,
        }));
      };
      if (loaded_deck && find_in_discard(loaded_deck.discard, card.id)) {
        this.discard.push(card);
      } else {
        this.draw_pile.push(card);
      }
    }

    write_to_storage(this.name, JSON.stringify(this));
  }

  draw_top_discard() {
    if (this.discard.length > 0) {
      const card = this.discard[this.discard.length - 1];
      let cards_lines = card.starting_lines;
      let extra_lines = [];
      if (this.is_boss()) {
        let new_lines = [];
        cards_lines.forEach((line) => {
          new_lines = new_lines.concat(special_to_lines(line, this.special1, this.special2));
        });
        cards_lines = new_lines;
        if (this.immunities) {
          extra_lines = extra_lines.concat(immunities_to_lines(this.immunities));
        }
        if (this.notes) {
          extra_lines = extra_lines.concat(notes_to_lines(this.notes));
        }
      } else if (this.attributes) {
        extra_lines = extra_lines.concat(attributes_to_lines(this.attributes));
      }

      card.paint_front_card(this.get_real_name(), cards_lines.concat(extra_lines), this.attack, this.move, this.range, this.level, this.health);

      card.ui.set_depth(-3);
      card.ui.addClass('pull');
      card.ui.flip_up(true);
      card.ui.removeClass('draw');
      card.ui.addClass('discard');
    }
    force_repaint_deck(this);
  }

  draw_top_card() {
    let cards_lines = this.draw_pile[0].starting_lines;
    let extra_lines = [];
    if (this.is_boss()) {
      let new_lines = [];
      cards_lines.forEach((line) => {
        new_lines = new_lines.concat(special_to_lines(line, this.special1, this.special2));
      });
      cards_lines = new_lines;
      if (this.immunities) {
        extra_lines = extra_lines.concat(immunities_to_lines(this.immunities));
      }
      if (this.notes) {
        extra_lines = extra_lines.concat(notes_to_lines(this.notes));
      }
    } else if (this.attributes) {
      extra_lines = extra_lines.concat(attributes_to_lines(this.attributes));
    }

    this.draw_pile[0].paint_front_card(this.get_real_name(), cards_lines.concat(extra_lines), this.attack, this.move, this.range, this.level, this.health);
    force_repaint_deck(this);
  }

  must_reshuffle() {
    if (!this.draw_pile.length) {
      return true;
    }
    if (do_shuffles && this.discard.length) {
      return this.discard[0].shuffle_next;
    }
    return false;
  }

  set_stats_monster(stats) {
    this.attack = stats.attack;
    this.move = stats.move;
    this.range = stats.range;
    this.attributes = stats.attributes;
    this.health = stats.health;
  }

  set_stats_boss(stats) {
    this.attack = stats.attack;
    this.move = stats.move;
    this.range = stats.range;
    this.special1 = stats.special1;
    this.special2 = stats.special2;
    this.immunities = stats.immunities;
    this.notes = stats.notes;
    this.health = stats.health;
  }

  get_real_name() {
    return (this.name) ? this.name : this.class;
  }

  is_boss() {
    return this.class == DECKS.Boss.class;
  }

  set_card_piles(draw_pile, discard_pile) {
    for (let i = 0; i < draw_pile.length; i += 1) {
      this.draw_pile[i].shuffle_next = draw_pile[i].shuffle_next;
      this.draw_pile[i].initiative = draw_pile[i].initiative;
      this.draw_pile[i].starting_lines = draw_pile[i].starting_lines;
    }
    for (let i = 0; i < discard_pile.length; i += 1) {
      this.discard[i].shuffle_next = discard_pile[i].shuffle_next;
      this.discard[i].initiative = discard_pile[i].initiative;
      this.discard[i].starting_lines = discard_pile[i].starting_lines;
    }
  }
}

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
  const cards = tableau.getElementsByClassName('card');
  for (let i = 1; i < cards.length; i += 1) {
    if (cards[i].className.indexOf('ability') !== -1) {
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

    card.ui.removeClass('lift');
    card.ui.removeClass('pull');

    card.ui.flip_up(false);

    card.ui.removeClass('discard');
    card.ui.addClass('draw');

    card.ui.set_depth(-i - 6);
  }
}

function flip_up_top_card(deck) {
  for (let i = 0; i < deck.discard.length; i += 1) {
    const card = deck.discard[i];
    card.ui.removeClass('lift');
    card.ui.removeClass('pull');
    card.ui.push_down();
  }

  if (deck.discard.length > 0) {
    deck.discard[0].ui.addClass('lift');
  }

  const card = deck.draw_pile.shift();
  send_to_discard(card, true);
  deck.discard.unshift(card);
}

function send_to_discard(card, pull_animation) {
  card.ui.set_depth(-3);

  if (pull_animation) {
    card.ui.addClass('pull');
  }

  card.ui.flip_up(true);

  card.ui.removeClass('draw');
  card.ui.addClass('discard');
}

function draw_ability_card(deck) {
  if (deck.must_reshuffle()) {
    reshuffle(deck, true);
  } else {
    visible_ability_decks.forEach((visible_deck) => {
      if (visible_deck.class == deck.class) {
        visible_deck.draw_top_card();
        flip_up_top_card(visible_deck);
      }
    });
  }
  write_to_storage(deck.name, JSON.stringify(deck));
}

function prevent_pull_animation(deck) {
  if (deck.discard.length) {
    if (deck.discard[1]) {
      deck.discard[1].ui.removeClass('lift');
      deck.discard[0].ui.addClass('lift');
    }

    deck.discard[0].ui.removeClass('pull');
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
  deck.discard[0].ui.addClass('right');
  advantage_card.ui.addClass('left');
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
      card.ui.addClass('pull');
      card.ui.flip_up(true);
      card.ui.removeClass('draw');
      card.ui.addClass('discard');
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

function load_definition(card_database) {
  const decks = {};
  for (let i = 0; i < card_database.length; i += 1) {
    const definition = card_database[i];
    decks[definition.class] = definition;
  }

  return decks;
}

function get_monster_stats(name, level) {
  const attack = [MONSTER_STATS.monsters[name].level[level].normal.attack,
    MONSTER_STATS.monsters[name].level[level].elite.attack,
  ];
  const move = [MONSTER_STATS.monsters[name].level[level].normal.move,
    MONSTER_STATS.monsters[name].level[level].elite.move,
  ];
  const range = [MONSTER_STATS.monsters[name].level[level].normal.range,
    MONSTER_STATS.monsters[name].level[level].elite.range,
  ];
  const attributes = [MONSTER_STATS.monsters[name].level[level].normal.attributes,
    MONSTER_STATS.monsters[name].level[level].elite.attributes,
  ];

  const health = [MONSTER_STATS.monsters[name].level[level].normal.health,
    MONSTER_STATS.monsters[name].level[level].elite.health,
  ];

  return {
    attack, move, range, attributes, health,
  };
}

function get_boss_stats(name, level) {
  name = name.replace('Boss: ', '');
  const attack = [MONSTER_STATS.bosses[name].level[level].attack];
  const move = [MONSTER_STATS.bosses[name].level[level].move];
  const range = [MONSTER_STATS.bosses[name].level[level].range];
  const special1 = MONSTER_STATS.bosses[name].level[level].special1;
  const special2 = MONSTER_STATS.bosses[name].level[level].special2;
  const immunities = MONSTER_STATS.bosses[name].level[level].immunities;
  const notes = MONSTER_STATS.bosses[name].level[level].notes;
  const health = [MONSTER_STATS.bosses[name].level[level].health];

  return {
    attack,
    move,
    range,
    special1,
    special2,
    immunities,
    notes,
    health,
  };
}

function apply_deck_selection(decks, preserve_existing_deck_state) {
  const container = document.getElementById('tableau');
  document.getElementById('currentdeckslist').innerHTML = '';
  const decks_to_remove = visible_ability_decks.filter(visible_deck => !preserve_existing_deck_state || (decks.filter(deck => ((deck.name == visible_deck.name) && (deck.level == visible_deck.level))).length == 0));

  const decks_to_add = decks.filter(deck => !preserve_existing_deck_state || (visible_ability_decks.filter(visible_deck => ((deck.name == visible_deck.name) && (deck.level == visible_deck.level))).length == 0));

  if (!modifier_deck) {
    init_modifier_deck();
    add_modifier_deck(container, modifier_deck, preserve_existing_deck_state);
    if (preserve_existing_deck_state) {
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
  } else if (!preserve_existing_deck_state) {
    container.removeChild(document.getElementById('modifier-container'));
    init_modifier_deck();
    add_modifier_deck(container, modifier_deck, preserve_existing_deck_state);
  }
  write_to_storage('modifier_deck', JSON.stringify(modifier_deck));

  decks_to_remove.forEach((deck) => {
    deck.discard_deck();
  });

  decks_to_add.forEach((deck) => {
    const deckid = deck.get_real_name().replace(/\s+/g, '');
    const deck_space = document.createElement('div');
    deck_space.id = deckid;
    deck_space.addEventListener('contextmenu', function (e) {
      this.className = 'hiddendeck';
      e.preventDefault();
    }, false);
    deck_space.className = 'card-container';

    container.appendChild(deck_space);

    place_deck(deck, deck_space);
    reshuffle(deck, !preserve_existing_deck_state);
    // if (preserve_existing_deck_state) {
    //
    // }
    deck_space.onclick = draw_ability_card.bind(null, deck);

    deck.discard_deck = function () {
      const index = visible_ability_decks.indexOf(this);

      if (index > -1) {
        visible_ability_decks.splice(index, 1);
      }

      container.removeChild(deck_space);
    };

    if (deck.is_boss()) {
      // We don't want stats if someone selects Boss on the deck tab
      if (deck.get_real_name() != 'Boss') {
        deck.set_stats_boss(get_boss_stats(deck.get_real_name(), deck.level));
      }
    } else {
      deck.set_stats_monster(get_monster_stats(deck.get_real_name(), deck.level));
    }
    reshuffle(deck);
    if (preserve_existing_deck_state) {
      deck.draw_top_discard();
    } else {
      force_repaint_deck(deck);
    }
    visible_ability_decks.push(deck);

    const currentdeckslist = document.getElementById('currentdeckslist');
    const list_item = document.createElement('li');
    list_item.className = 'currentdeck';
    currentdeckslist.appendChild(list_item);
    const label = document.createElement('a');
    label.id = `switch-${deckid}`;
    label.href = `#switch-${deckid}`;
    label.innerText = deck.get_real_name();
    label.addEventListener('click', function () {
      const d = document.getElementById(this.id.replace('switch-', ''));
      d.className = (d.className == 'hiddendeck') ? 'card-container' : 'hiddendeck';
    }, false);
    list_item.appendChild(label);
  });

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
  modifier_container.className = 'card-container';
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
  deck_space.className = 'card-container modifier';

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

function ScenarioList(scenarios) {
  const scenariolist = {};
  scenariolist.ul = document.createElement('ul');
  scenariolist.ul.className = 'selectionlist';
  scenariolist.spinner = null;
  scenariolist.decks = {};
  scenariolist.special_rules = {};
  scenariolist.level_selector = null;

  const levelSelectorLi = document.createElement('li');
  ReactDOM.render(
    React.createElement(LevelSelector, {
      inline: false,
      text: 'Select level',
      ref: (element) => {
        scenariolist.level_selector = element;
      },
    }),
    levelSelectorLi,
  );
  scenariolist.ul.appendChild(levelSelectorLi);

  for (let i = 0; i < scenarios.length; i += 1) {
    const scenario = scenarios[i];
    scenariolist.decks[i] = scenario.decks;
    scenariolist.special_rules[i] = scenario.special_rules ? scenario.special_rules : '';
  }

  const listitem = document.createElement('li');
  listitem.innerText = 'Select scenario number';
  scenariolist.ul.appendChild(listitem);

  const scenario_spinner = create_input('number', 'scenario_number', '1', '');
  scenario_spinner.input.min = 1;
  scenario_spinner.input.max = scenarios.length;
  scenariolist.ul.appendChild(scenario_spinner.input);
  scenariolist.spinner = scenario_spinner.input;

  scenariolist.get_selection = function () {
    // We're using the scenario index that is zero-based, but the scenario list is 1-based
    const current_value = scenariolist.spinner.value - 1;
    return Math.min(current_value, scenarios.length + 1);
  };

  scenariolist.get_level = function (deck_name, special_rules) {
    const base_level = scenariolist.level_selector.get_selection();

    if ((special_rules.indexOf(SPECIAL_RULES.living_corpse_two_levels_extra) >= 0) && (deck_name == SPECIAL_RULES.living_corpse_two_levels_extra.affected_deck)) {
      return Math.min(7, (parseInt(base_level) + parseInt(SPECIAL_RULES.living_corpse_two_levels_extra.extra_levels)));
    }
    return base_level;
  };

  scenariolist.get_scenario_decks = function () {
    return (this.decks[this.get_selection()].map((deck) => {
      if (DECKS[deck.name]) {
        deck.class = DECKS[deck.name].class;
      } else if (deck.name.indexOf('Boss') != -1) {
        deck.class = DECKS.Boss.class;
      }
      deck.level = scenariolist.get_level(deck.name, scenariolist.get_special_rules());
      return deck;
    }));
  };

  scenariolist.get_special_rules = function () {
    return this.special_rules[this.get_selection()];
  };

  return scenariolist;
}

export function init() {
  const deckspage = document.getElementById('deckspage');
  const scenariospage = document.getElementById('scenariospage');
  const applydeckbtn = document.getElementById('applydecks');
  const applyscenariobtn = document.getElementById('applyscenario');
  const applyloadbtn = document.getElementById('applyload');
  const showmodifierdeck = document.getElementById('showmodifierdeck');

  const decklistDiv = document.createElement('div');
  let decklist;
  ReactDOM.render(
    React.createElement(DeckList, {
      ref: (element) => { decklist = element; },
    }),
    decklistDiv,
  );
  const scenariolist = new ScenarioList(SCENARIO_DEFINITIONS);

  deckspage.insertAdjacentElement('afterbegin', decklistDiv);
  scenariospage.insertAdjacentElement('afterbegin', scenariolist.ul);

  applydeckbtn.onclick = function () {
    localStorage.clear();
    const selected_deck_names = decklist.get_selected_decks();
    write_to_storage('selected_deck_names', JSON.stringify(selected_deck_names));
    const selected_decks = selected_deck_names.map(deck_names => new AbilityDeck(deck_names.class, deck_names.name, deck_names.level));
    apply_deck_selection(selected_decks, true);
    const showmodifierdeck_deckspage = document.getElementById('showmodifierdeck-deckspage');
    const modifier_deck_section = document.getElementById('modifier-container');
    if (!showmodifierdeck_deckspage.checked) {
      modifier_deck_section.style.display = 'none';
    } else {
      modifier_deck_section.style.display = 'block';
    }
  };

  applyscenariobtn.onclick = function () {
    localStorage.clear();
    const selected_deck_names = scenariolist.get_scenario_decks();
    write_to_storage('selected_deck_names', JSON.stringify(selected_deck_names));
    decklist.set_selection(selected_deck_names);
    const selected_decks = selected_deck_names.map(deck_names => new AbilityDeck(deck_names.class, deck_names.name, deck_names.level));
    apply_deck_selection(selected_decks, false);
    const modifier_deck_section = document.getElementById('modifier-container');
    if (!showmodifierdeck.checked) {
      modifier_deck_section.style.display = 'none';
    } else {
      modifier_deck_section.style.display = 'block';
    }
  };

  applyloadbtn.onclick = function () {
    const selected_deck_names = JSON.parse(get_from_storage('selected_deck_names'));
    decklist.set_selection(selected_deck_names);
    const selected_decks = selected_deck_names.map(deck_names => new AbilityDeck(deck_names.class, deck_names.name, deck_names.level));
    apply_deck_selection(selected_decks, true);
    const modifier_deck_section = document.getElementById('modifier-container');
    if (!showmodifierdeck.checked) {
      modifier_deck_section.style.display = 'none';
    } else {
      modifier_deck_section.style.display = 'block';
    }
  };

  window.onresize = refresh_ui.bind(null, visible_ability_decks);
}

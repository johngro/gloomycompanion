import { shuffle_list } from './util';

export default class DeckState {
  constructor(draw_pile, discard, name) {
    this.draw_pile = draw_pile;
    this.discard = discard;
    this.name = name;
  }

  static create(definition, name, storageState) {
    let draw_pile = [];
    let discard = [];

    if (storageState == null) {
      for (const [i, cardDef] of definition.cards.entries()) {
        const [shuffle, initiative, ...lines] = cardDef;
        const card = {
          id: `${name}_${i}`,
          shuffle_next: shuffle,
          initiative,
          starting_lines: lines,
        };

        draw_pile.push(card);
      }
      shuffle_list(draw_pile);
    } else {
      draw_pile = storageState.draw_pile || [];
      discard = storageState.discard || [];
    }

    return new DeckState(draw_pile, discard, name);
  }

  draw_card() {
    const drewCard = this.draw_pile[0];
    return new DeckState(this.draw_pile.slice(1), [drewCard, ...this.discard], this.name);
  }

  mustReshuffle() {
    if (!this.draw_pile.length) {
      return true;
    }
    if (this.discard.length) {
      return this.discard[0].shuffle_next;
    }
    return false;
  }

  reshuffle() {
    const newDraw = [...this.draw_pile, ...this.discard];
    shuffle_list(newDraw);
    return new DeckState(newDraw, [], this.name);
  }
}

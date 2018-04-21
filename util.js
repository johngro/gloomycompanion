export function shuffle_list(l) {
  for (let i = 0; i < l.length - 1; i += 1) {
    // Based on https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#Implementation_errors
    const switch_index = i + Math.floor(Math.random() * (l.length - i));
    const tmp = l[switch_index];
    l[switch_index] = l[i];
    l[i] = tmp;
  }
}

export function remove_empty_strings(array) {
  return array.filter(Boolean);
}

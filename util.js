
export function shuffle_list(l) {
  for (let i = 0; i < l.length - 1; i += 1) {
    // Based on https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#Implementation_errors
    const switch_index = i + Math.floor(Math.random() * (l.length - i));
    const tmp = l[switch_index];
    l[switch_index] = l[i];
    l[i] = tmp;
  }
}

export function remove_child(myNode) {
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
}

export function create_input(type, name, value, text) {
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.value = value;

  const textnode = document.createTextNode(text);

  const label = document.createElement('label');
  label.appendChild(input);
  label.appendChild(textnode);

  return { root: label, input };
}

export function remove_empty_strings(array) {
  return array.filter(Boolean);
}

export function write_to_storage(name, value) {
  localStorage.setItem(name, value);
  console.log(`Wrote ${name} to local storage, with value: ${value}`);
}

export function get_from_storage(name) {
  return localStorage.getItem(name);
}

export function find_in_discard(discard, id) {
  for (let i = 0; i < discard.length; i += 1) {
    if (discard[i].id === id) {
      return discard[i];
    }
  }
  return null;
}

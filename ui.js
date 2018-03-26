

function activate_tab(tabs, pages, activetab) {
  for (const key in tabs) {
    tabs[key].className = (key == activetab) ? '' : 'inactive';
  }
  for (const key in pages) {
    pages[key].className = (key == activetab) ? 'tabbody' : 'inactive tabbody';
  }
}

function show_settingspane(pane, cancelarea, show) {
  pane.className = show ? 'pane' : 'pane inactive';
  cancelarea.style.display = show ? 'initial' : 'none';
}

export function init_ui() {
  const tabs =
    {
      scenarios: document.getElementById('scenariotab'),
      decks: document.getElementById('deckstab'),
    };
  const pages =
    {
      scenarios: document.getElementById('scenariospage'),
      decks: document.getElementById('deckspage'),
    };

  const settingspane = document.getElementById('settingspane');
  const settingsbtn = document.getElementById('settingsbtn');
  const cancelarea = document.getElementById('cancelarea');

  tabs.scenarios.onclick = function () {
    activate_tab(tabs, pages, 'scenarios');
  };

  tabs.decks.onclick = function () {
    activate_tab(tabs, pages, 'decks');
  };

  settingsbtn.onclick = function () {
    show_settingspane(settingspane, cancelarea, true);
  };

  cancelarea.onclick = function () {
    show_settingspane(settingspane, cancelarea, false);
  };

  activate_tab(tabs, pages, 'scenarios');
}

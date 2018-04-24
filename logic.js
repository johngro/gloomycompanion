import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import SettingsPane from './SettingsPane';
import Tableau from './Tableau';
import firebase, { useFirebase } from './firebase';

// Import global styles for side effects
import './cards.css';
import './style.css';

// TODO Adding an extra Guard deck will reshuffle the first one, End of round with multiple Archers, resize text, worth to show common and elite_only attributes?, shield and retaliate only when shown (apparently, attribtues are active at the beginning of the turn, and active after initiative)

export function init() {
  ReactDOM.render(React.createElement(App), document.getElementById('app'));
}

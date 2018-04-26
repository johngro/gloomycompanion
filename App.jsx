import React from 'react';
import { hot } from 'react-hot-loader';
import uuidv4 from 'uuid/v4';

import MainUI from './MainUI';
import { useFirebase } from './firebase';
import { StorageContext } from './storage';

class App extends React.Component {
  state = { locationHash: window.location.hash };

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange);
    this.handleHashChange();
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  handleHashChange = () => {
    if (useFirebase && window.location.hash.length === 0) {
      window.location.hash = `#${uuidv4()}`;
    }
    if (window.location.hash !== this.state.locationHash) {
      this.setState({ locationHash: window.location.hash });
    }
  }

  render() {
    const storageContext = { useFirebase };
    if (useFirebase && this.state.locationHash) {
      const gameUuid = this.state.locationHash.slice(1);
      storageContext.firebaseRoot = `games/${gameUuid}/`;
    }
    return (
      <React.StrictMode>
        <StorageContext.Provider value={storageContext}>
          <MainUI />
        </StorageContext.Provider>
      </React.StrictMode>
    );
  }
}

export default hot(module)(App);

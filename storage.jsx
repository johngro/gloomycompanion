import PropTypes from 'prop-types';
import React from 'react';

import firebase, { useFirebase } from './firebase';

export function withStorage(Component, mapping) {
  const defaultLoaded = {};
  const defaultValues = {};
  for (const [key, settings] of Object.entries(mapping)) {
    const { deserialize = x => x } = settings;
    defaultLoaded[key] = !useFirebase;
    defaultValues[key] = deserialize(null);
  }

  return class WithStorage extends React.Component {
    state = { loaded: defaultLoaded, values: defaultValues }

    componentDidMount() {
      if (useFirebase) {
        this.storageRefs = {};
        for (const [key, settings] of Object.entries(mapping)) {
          this.storageRefs[key] = firebase.database().ref(settings.path);
          this.storageRefs[key].on('value', snap => this.setStateKey(key, () => snap.val()));
        }
      }
    }

    componentWillUnmount() {
      if (useFirebase) {
        for (const ref of Object.values(this.storageRefs)) {
          ref.off();
        }
      }
    }

    setStateKey(key, fn) {
      const { deserialize = x => x } = mapping[key];
      this.setState(({ loaded, values }) => ({
        loaded: { ...loaded, [key]: true },
        values: { ...values, [key]: deserialize(fn(values[key])) },
      }));
    }

    mutate(key, mutator) {
      const { serialize = x => x, deserialize = x => x } = mapping[key];
      if (useFirebase) {
        this.storageRefs[key].transaction(v => serialize(mutator(deserialize(v))));
      } else {
        this.setStateKey(key, v => serialize(mutator(v)));
      }
    }

    reset() {
      if (useFirebase) {
        for (const ref of Object.values(this.storageRefs)) {
          ref.remove();
        }
      } else {
        this.setState({ values: defaultValues });
      }
    }

    render() {
      if (Object.keys(mapping).some(v => !this.state.loaded[v])) {
        return <span>Loading...</span>;
      }
      const valueProps = {};
      for (const key of Object.keys(mapping)) {
        valueProps[key] = {
          value: this.state.values[key],
          mutate: m => this.mutate(key, m),
        };
      }
      return <Component {...this.props} {...valueProps} />;
    }
  };
}

export function storageValueProp(valueType) {
  return PropTypes.shape({
    value: valueType,
    mutate: PropTypes.func.isRequired,
  });
}

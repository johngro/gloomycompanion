import PropTypes from 'prop-types';
import React from 'react';

import firebase from './firebase';

export const StorageContext = React.createContext({});

export function withStorage(Component, mapping) {
  class WithStorage extends React.Component {
    static propTypes = {
      context: PropTypes.shape({
        firebaseRoot: PropTypes.string,
        useFirebase: PropTypes.bool,
      }).isRequired,
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      if (nextProps.context !== prevState.lastContext) {
        const defaultLoaded = {};
        const defaultValues = {};
        for (const [key, settings] of Object.entries(mapping)) {
          const { deserialize = x => x } = settings;
          defaultLoaded[key] = !nextProps.context.useFirebase;
          defaultValues[key] = deserialize(null);
        }
        return {
          defaultValues,
          lastContext: nextProps.context,
          loaded: defaultLoaded,
          values: defaultValues,
        };
      }
      return null;
    }

    state = {}

    componentDidMount() {
      if (this.props.context.useFirebase) {
        this.firebaseRegister();
      }
    }

    componentDidUpdate(prevProps) {
      if (this.props.context !== prevProps.context) {
        if (prevProps.context.useFirebase) {
          this.firebaseCleanup();
        }
        if (this.props.context.useFirebase) {
          this.firebaseRegister();
        }
      }
    }

    componentWillUnmount() {
      if (this.props.context.useFirebase) {
        this.firebaseCleanup();
      }
    }

    setStateKey(key, fn) {
      const { deserialize = x => x } = mapping[key];
      this.setState(({ loaded, values }) => ({
        loaded: { ...loaded, [key]: true },
        values: { ...values, [key]: deserialize(fn(values[key])) },
      }));
    }

    firebaseCleanup() {
      for (const ref of Object.values(this.storageRefs)) {
        ref.off();
      }
    }

    firebaseRegister() {
      const prefix = this.props.context.firebaseRoot || '';
      this.storageRefs = {};
      for (const [key, settings] of Object.entries(mapping)) {
        this.storageRefs[key] = firebase.database().ref(prefix + settings.path);
        this.storageRefs[key].on('value', snap => this.setStateKey(key, () => snap.val()));
      }
    }

    mutate(key, mutator) {
      const { serialize = x => x, deserialize = x => x } = mapping[key];
      if (this.props.context.useFirebase) {
        this.storageRefs[key].transaction(v => serialize(mutator(deserialize(v))));
      } else {
        this.setStateKey(key, v => serialize(mutator(v)));
      }
    }

    reset() {
      if (this.props.context.useFirebase) {
        for (const ref of Object.values(this.storageRefs)) {
          ref.remove();
        }
      } else {
        this.setState({ values: this.state.defaultValues });
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
  }

  const forwardRef = (props, ref) => (
    <StorageContext.Consumer>
      {context => <WithStorage {...props} context={context} ref={ref} />}
    </StorageContext.Consumer>
  );
  forwardRef.displayName = `withStorage(${Component.displayName || Component.name})`;
  return React.forwardRef(forwardRef);
}

export function storageValueProp(valueType) {
  return PropTypes.shape({
    value: valueType,
    mutate: PropTypes.func.isRequired,
  });
}

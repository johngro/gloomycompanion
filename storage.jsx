import PropTypes from 'prop-types';
import React from 'react';

import firebase, { useFirebase } from './firebase';

export function withStorage(Component, mapping) {
  const defaultValues = {};
  for (const [key, settings] of Object.entries(mapping)) {
    const { deserialize = x => x } = settings;
    defaultValues[key] = deserialize(null);
  }

  class WithStorage extends React.Component {
    static defaultProps = { forwardedRef: null };
    static propTypes = { forwardedRef: PropTypes.object };

    constructor(props) {
      super(props);
      if (useFirebase) {
        this.state = { loaded: {}, values: {} };
      } else {
        const loaded = {};
        for (const key of Object.keys(mapping)) {
          loaded[key] = true;
        }
        this.state = { loaded, values: defaultValues };
      }
    }

    componentDidMount() {
      if (useFirebase) {
        this.storageRefs = {};
        for (const [key, settings] of Object.entries(mapping)) {
          const { deserialize = x => x } = settings;
          this.storageRefs[key] = firebase.database().ref(settings.path);
          this.storageRefs[key].on('value', (snap) => {
            this.setState(({ loaded, values }) => ({
              loaded: { ...loaded, [key]: true },
              values: { ...values, [key]: deserialize(snap.val()) },
            }));
          });
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

    handleMutate = (key, mutator) => {
      const { serialize = x => x, deserialize = x => x } = mapping[key];
      if (useFirebase) {
        this.storageRefs[key].transaction(v => serialize(mutator(deserialize(v))));
      } else {
        this.setState(({ values }) => ({
          values: {
            ...values,
            [key]: serialize(mutator(deserialize(values[key]))),
          },
        }));
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
      const passProps = { ...this.props };
      delete passProps.forwardedRef;
      return (
        <Component
          {...passProps}
          ref={this.props.forwardedRef}
          storage={this.state.values}
          storageMutate={this.handleMutate}
        />
      );
    }
  }

  return WithStorage;
}

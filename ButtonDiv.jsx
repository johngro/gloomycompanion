import PropTypes from 'prop-types';
import React from 'react';

export default function ButtonDiv(props) {
  return (
    <div
      className={props.className}
      id={props.id}
      onClick={props.onClick}
      onKeyPress={(e) => { if (e.key === 'Enter') props.onClick(e); }}
      role="button"
      style={props.style}
      tabIndex="0"
    >
      {props.children}
    </div>
  );
}

ButtonDiv.defaultProps = {
  children: null,
  className: null,
  id: null,
  style: null,
};

ButtonDiv.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.objectOf(PropTypes.string),
};

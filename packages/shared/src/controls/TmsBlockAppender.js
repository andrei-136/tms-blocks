import React from 'react';
import { Inserter } from '@wordpress/block-editor';


export default function TmsBlockAppender({ rootClientId }) {
  return (
    <Inserter
      rootClientId={ rootClientId }
      position="bottom center"
      isAppender
      renderToggle={ ({ onToggle, disabled }) => (
        <button
          type="button"
          className="components-button block-editor-button-block-appender tmsblocks-block-appender__button"
          onClick={ onToggle }
          disabled={ disabled }
          aria-label="Add block"
        >
          +
        </button>
      ) }
    />
  );
}

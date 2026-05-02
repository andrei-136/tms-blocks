import React, { useState, useEffect } from 'react';
import { TextControl } from '@wordpress/components';
import ClassNameControl from './ClassNameControl';
import ControlLabel from './ControlLabel';

function sanitizeHtmlId(value) {
  return value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^-+/, '');
}

export default function IdentityControls({
  attributes,
  setAttributes,
  showClassNameControl = true
}) {
  const { anchorId = '', tmsClassName = '' } = attributes;
  const [localId, setLocalId] = useState(anchorId);

  // Keep local state in sync if the attribute changes externally (e.g. undo)
  useEffect(() => {
    setLocalId(anchorId);
  }, [anchorId]);

  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="ID" />
      </div>
      <TextControl
        label="ID"
        hideLabelFromVision
        value={localId}
        onChange={(val) => setLocalId(val)}
        onBlur={() => setAttributes({ anchorId: sanitizeHtmlId(localId) })}
       
      />
      {showClassNameControl && (
        <ClassNameControl
          value={tmsClassName}
          onChange={(val) => setAttributes({ tmsClassName: val })}
        />
      )}
    </>
  );
}

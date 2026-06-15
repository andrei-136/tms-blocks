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
  showClassNameControl = true,
  masterAttributes = null,
}) {
  const { anchorId = '', tmsClassName = '' } = attributes;
  const [localId, setLocalId] = useState(anchorId);
  const masterAnchorId = masterAttributes?.anchorId || '';
  const isIdEmpty = !anchorId && !masterAnchorId;
  const idLevel = masterAttributes ? (isIdEmpty ? 0 : (anchorId === masterAnchorId ? 2 : 3)) : 0;
  const masterClassName = masterAttributes?.tmsClassName || '';
  const isClassEmpty = !tmsClassName && !masterClassName;
  const classLevel = masterAttributes ? (isClassEmpty ? 0 : (tmsClassName === masterClassName ? 2 : 3)) : 0;

  // Keep local state in sync if the attribute changes externally (e.g. undo)
  useEffect(() => {
    setLocalId(anchorId);
  }, [anchorId]);

  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="ID" level={idLevel} />
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
          level={classLevel}
        />
      )}
    </>
  );
}

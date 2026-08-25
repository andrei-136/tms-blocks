import React from 'react';
import { SelectControl } from '@wordpress/components';
import ControlLabel from './ControlLabel';

export default function ListSettings({ attributes, setAttributes, masterAttributes = null, customStyle = {}, updateCustomStyle }) {
  const { tagName } = attributes;

  // Dot for the List Type (tagName) — same wrapper-property convention as the
  // other controls: NO dot on standalone; on an instance, no dot when both are
  // at the default (ul), purple when the instance matches the master, orange
  // when overridden.
  const DEFAULT_TAG = 'ul';
  const currentTag  = tagName || DEFAULT_TAG;
  const masterTag   = masterAttributes?.tagName || DEFAULT_TAG;
  const isDefault   = currentTag === DEFAULT_TAG && masterTag === DEFAULT_TAG;
  const tagLevel    = masterAttributes ? (isDefault ? 0 : (currentTag === masterTag ? 2 : 3)) : 0;

  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="List Type" level={tagLevel} />
      </div>
      <SelectControl
        label="List Type"
        hideLabelFromVision
        value={currentTag}
        options={[
          { label: 'Unordered List (ul)', value: 'ul' },
          { label: 'Ordered List (ol)', value: 'ol' }
        ]}
        onChange={(value) => setAttributes({ tagName: value })}
      />
    </>
  );
}

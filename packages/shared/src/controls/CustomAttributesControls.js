import React from 'react';
import AttributeRepeater from './AttributeRepeater';
import ControlLabel from './ControlLabel';

// Allowed keys for custom attributes.
// data-* is handled as a special wildcard by AttributeRepeater.
const CUSTOM_ATTRIBUTE_KEYS = [
  'data-*',
  'tabindex',
  'title',
  'download',
];

export default function CustomAttributesControls({ attributes, setAttributes, extraAllowedKeys = [], keywordValueMap = {}, masterAttributes = null }) {
  const { customAttributes = [] } = attributes;
  const allKeys = [...CUSTOM_ATTRIBUTE_KEYS, ...extraAllowedKeys];
  const hasCustomAttrs = customAttributes.length > 0;
  const masterCustomAttrs = masterAttributes?.customAttributes || [];
  const masterHasCustomAttrs = masterCustomAttrs.length > 0;
  const isCustomAttrsDefault = !hasCustomAttrs && !masterHasCustomAttrs;
  const customAttrLevel = masterAttributes ? (isCustomAttrsDefault ? 0 : (JSON.stringify(customAttributes) === JSON.stringify(masterCustomAttrs) ? 2 : 3)) : 0;

  return (
    <>
      {/* <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Custom Attributes" level={customAttrLevel} />
      </div> */}
      <AttributeRepeater
        label="Custom Attributes"
        value={customAttributes}
        onChange={(val) => setAttributes({ customAttributes: val })}
        allowedKeys={allKeys}
        keywordValueMap={keywordValueMap}
        showEmptyRow
        level={customAttrLevel}
      />
    </>
  );
}

import React from 'react';
import AttributeRepeater from './AttributeRepeater';

// Allowed keys for custom attributes.
// data-* is handled as a special wildcard by AttributeRepeater.
const CUSTOM_ATTRIBUTE_KEYS = [
  'data-*',
  'tabindex',
  'title',
  'download',
];

export default function CustomAttributesControls({ attributes, setAttributes, extraAllowedKeys = [], keywordValueMap = {} }) {
  const { customAttributes = [] } = attributes;
  const allKeys = [...CUSTOM_ATTRIBUTE_KEYS, ...extraAllowedKeys];

  return (
    <AttributeRepeater
      label="Custom Attributes"
      value={customAttributes}
      onChange={(val) => setAttributes({ customAttributes: val })}
      allowedKeys={allKeys}
      keywordValueMap={keywordValueMap}
      showEmptyRow
    />
  );
}

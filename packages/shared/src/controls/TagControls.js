import React from 'react';
import { SelectControl } from '@wordpress/components';
import ControlLabel from './ControlLabel';

const DEFAULT_TAG_NAME_OPTIONS = [
  { label: 'Div', value: 'div' },
  { label: 'Section', value: 'section' },
  { label: 'Header', value: 'header' },
  { label: 'Footer', value: 'footer' },
  { label: 'Aside', value: 'aside' },
  { label: 'Nav', value: 'nav' },
  { label: 'Main', value: 'main' },
  { label: 'Article', value: 'article' },
  { label: 'Figure', value: 'figure' },
];

export default function TagControls({
  tagName,
  setTagName,
  tagNameOptions = DEFAULT_TAG_NAME_OPTIONS,
  attributes,
  setAttributes,
  masterAttributes = null,
}) {
  const resolvedTagName = tagName ?? attributes?.tagName;
  const resolvedSetTagName = setTagName
    || ((value) => {
      if (setAttributes) {
        setAttributes({ tagName: value });
      }
    });
  const defaultTagName = tagNameOptions[0]?.value || 'div';
  const currentTag = resolvedTagName || defaultTagName;
  const masterTag = masterAttributes?.tagName || defaultTagName;
  const isTagDefault = currentTag === defaultTagName && masterTag === defaultTagName;
  const tagLevel = masterAttributes ? (isTagDefault ? 0 : (currentTag === masterTag ? 2 : 3)) : 0;

  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Element Tag" level={tagLevel} />
      </div>
      <SelectControl
        label="Element Tag"
        hideLabelFromVision
        value={resolvedTagName || defaultTagName}
        options={tagNameOptions}
        onChange={resolvedSetTagName}
        
      />
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { TextControl, SelectControl, PanelBody } from '@wordpress/components';
import AttributeRepeater from './AttributeRepeater';

const ROLE_OPTIONS = [
  { label: 'None', value: '' },
  // Landmark roles
  { label: 'banner', value: 'banner' },
  { label: 'complementary', value: 'complementary' },
  { label: 'contentinfo', value: 'contentinfo' },
  { label: 'form', value: 'form' },
  { label: 'main', value: 'main' },
  { label: 'navigation', value: 'navigation' },
  { label: 'region', value: 'region' },
  { label: 'search', value: 'search' },
  // Common widget roles
  { label: 'alert', value: 'alert' },
  { label: 'button', value: 'button' },
  { label: 'dialog', value: 'dialog' },
  { label: 'img', value: 'img' },
  { label: 'link', value: 'link' },
  { label: 'list', value: 'list' },
  { label: 'listitem', value: 'listitem' },
  { label: 'presentation', value: 'presentation' },
  { label: 'tab', value: 'tab' },
  { label: 'tablist', value: 'tablist' },
  { label: 'tabpanel', value: 'tabpanel' },
];

// Extra aria-* attributes not covered by the main controls above.
const EXTRA_ARIA_KEYS = [
  'aria-atomic',
  'aria-busy',
  'aria-checked',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-disabled',
  'aria-expanded',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-keyshortcuts',
  'aria-labelledby',
  'aria-level',
  'aria-live',
  'aria-multiline',
  'aria-multiselectable',
  'aria-orientation',
  'aria-owns',
  'aria-placeholder',
  'aria-pressed',
  'aria-readonly',
  'aria-relevant',
  'aria-required',
  'aria-roledescription',
  'aria-selected',
  'aria-sort',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
];

// Attributes whose values must come from a fixed list of tokens.
// Keys listed here will render a SelectControl instead of a TextControl.
const ARIA_KEYWORD_VALUE_MAP = {
  'aria-autocomplete': [
    { label: 'none',   value: 'none' },
    { label: 'inline', value: 'inline' },
    { label: 'list',   value: 'list' },
    { label: 'both',   value: 'both' },
  ],
  'aria-checked': [
    { label: 'false', value: 'false' },
    { label: 'true',  value: 'true' },
    { label: 'mixed', value: 'mixed' },
  ],
  'aria-current': [
    { label: 'false',    value: 'false' },
    { label: 'true',     value: 'true' },
    { label: 'page',     value: 'page' },
    { label: 'step',     value: 'step' },
    { label: 'location', value: 'location' },
    { label: 'date',     value: 'date' },
    { label: 'time',     value: 'time' },
  ],
  'aria-expanded': [
    { label: 'false', value: 'false' },
    { label: 'true',  value: 'true' },
  ],
  'aria-haspopup': [
    { label: 'false',   value: 'false' },
    { label: 'true',    value: 'true' },
    { label: 'menu',    value: 'menu' },
    { label: 'listbox', value: 'listbox' },
    { label: 'tree',    value: 'tree' },
    { label: 'grid',    value: 'grid' },
    { label: 'dialog',  value: 'dialog' },
  ],
  'aria-invalid': [
    { label: 'false',   value: 'false' },
    { label: 'true',    value: 'true' },
    { label: 'grammar', value: 'grammar' },
    { label: 'spelling', value: 'spelling' },
  ],
  'aria-live': [
    { label: 'off',       value: 'off' },
    { label: 'polite',    value: 'polite' },
    { label: 'assertive', value: 'assertive' },
  ],
  'aria-orientation': [
    { label: 'horizontal', value: 'horizontal' },
    { label: 'vertical',   value: 'vertical' },
  ],
  'aria-pressed': [
    { label: 'false', value: 'false' },
    { label: 'true',  value: 'true' },
    { label: 'mixed', value: 'mixed' },
  ],
  'aria-selected': [
    { label: 'false', value: 'false' },
    { label: 'true',  value: 'true' },
  ],
  'aria-sort': [
    { label: 'none',       value: 'none' },
    { label: 'ascending',  value: 'ascending' },
    { label: 'descending', value: 'descending' },
    { label: 'other',      value: 'other' },
  ],
};

export default function AriaControls({ attributes, setAttributes, roleOptions = ROLE_OPTIONS, showRole = true }) {
  const { ariaLabel = '', ariaRole = '', extraAriaAttributes = [] } = attributes;
  const [localAriaLabel, setLocalAriaLabel] = useState(ariaLabel);

  useEffect(() => {
    setLocalAriaLabel(ariaLabel);
  }, [ariaLabel]);

  const hasExtraAria = extraAriaAttributes.some((entry) => entry.key && entry.value);

  return (
    <>
      <TextControl
        label="ARIA Label"
        value={localAriaLabel}
        onChange={(val) => setLocalAriaLabel(val)}
        onBlur={() => setAttributes({ ariaLabel: localAriaLabel.trim() })}
       
      />

      {showRole && (
      <SelectControl
        label="Role"
        value={ariaRole}
        options={roleOptions}
        onChange={(val) => setAttributes({ ariaRole: val })}
        
      />
      )}
      
      
        <AttributeRepeater
          label="Extra ARIA Attributes"
          value={extraAriaAttributes}
          onChange={(val) => setAttributes({ extraAriaAttributes: val })}
          allowedKeys={EXTRA_ARIA_KEYS}
          keywordValueMap={ARIA_KEYWORD_VALUE_MAP}
          showEmptyRow
        />
      
    </>
  );
}

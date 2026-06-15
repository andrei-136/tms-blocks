import React, { useCallback } from 'react';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { MODIFICATION_LEVEL_COLORS } from '../style-utils';

const DEFAULT_TAG_NAME_OPTIONS = [
  { label: 'Div', value: 'div' },
  { label: 'Section', value: 'section' },
  { label: 'Header', value: 'header' },
  { label: 'Footer', value: 'footer' },
  { label: 'Aside', value: 'aside' },
  { label: 'Nav', value: 'nav' },
  { label: 'Main', value: 'main' },
  { label: 'Article', value: 'article' },
];

const WRAPPER_ATTRS = ['tagName', 'anchorId', 'ariaLabel', 'role', 'customAttributes'];

export default function WrapperControls({
  attributes,
  setAttributes,
  showTagNameControl = true,
  masterAttributes = null,
}) {
  const { tagName, anchorId, ariaLabel, role, customAttributes } = attributes;
  const defaultTagName = DEFAULT_TAG_NAME_OPTIONS[0]?.value || 'div';

  // When on a component instance, compare each attribute against the master.
  // Returns 0 (no dot for standalone), 2 (purple – matches), or 3 (orange – overridden).
  const getAttrLevel = useCallback((key) => {
    if (!masterAttributes) return 0;
    const instanceVal = attributes[key];
    const masterVal = key === 'tagName'
      ? (masterAttributes[key] || defaultTagName)
      : (masterAttributes[key] || '');
    return instanceVal === masterVal ? 2 : 3;
  }, [masterAttributes, attributes]);

  // Max level across all wrapper attributes
  const panelLevel = Math.max(...WRAPPER_ATTRS.map((k) => getAttrLevel(k)));

  return (
    <PanelBody title={<PanelTitle title="Wrapper Settings" level={panelLevel} />} initialOpen={false}>
      {showTagNameControl && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="HTML Tag" level={getAttrLevel('tagName')} />
          </div>
        <SelectControl
          label="HTML Tag"
          hideLabelFromVision
          value={tagName}
          options={DEFAULT_TAG_NAME_OPTIONS}
          onChange={(value) => setAttributes({ tagName: value })}
        />
        </>
      )}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="ID" level={getAttrLevel('anchorId')} />
      </div>
      <TextControl
        label="ID"
        hideLabelFromVision
        value={anchorId}
        onChange={(val) => setAttributes({ anchorId: val })}
      />
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="ARIA Label" level={getAttrLevel('ariaLabel')} />
      </div>
      <TextControl
        label="ARIA Label"
        hideLabelFromVision
        value={ariaLabel}
        onChange={(val) => setAttributes({ ariaLabel: val })}
      />
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Role" level={getAttrLevel('role')} />
      </div>
      <TextControl
        label="Role"
        hideLabelFromVision
        value={role}
        onChange={(val) => setAttributes({ role: val })}
      />
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Custom Attributes" level={getAttrLevel('customAttributes')} />
      </div>
      <TextControl
        label="Custom Attributes"
        hideLabelFromVision
        value={customAttributes}
        onChange={(val) => setAttributes({ customAttributes: val })}
      />
    </PanelBody>
  );
}

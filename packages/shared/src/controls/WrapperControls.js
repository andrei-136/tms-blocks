import React from 'react';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

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

export default function WrapperControls({
  attributes,
  setAttributes,
  showTagNameControl = true,
}) {
  const { tagName, anchorId, ariaLabel, role, customAttributes } = attributes;
  const defaultTagName = DEFAULT_TAG_NAME_OPTIONS[0]?.value || 'div';
  const isModified = hasModifiedStyleProps(attributes, ['tagName', 'anchorId', 'ariaLabel', 'role', 'customAttributes'], { tagName: defaultTagName });

  return (
    <PanelBody title={<PanelTitle title="Wrapper Settings" isModified={isModified} />} initialOpen={false}>
      {showTagNameControl && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="HTML Tag" isSet={isStylePropSet(attributes, 'tagName', { tagName: defaultTagName })} />
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
        <ControlLabel label="ID" isSet={isStylePropSet(attributes, 'anchorId')} />
      </div>
      <TextControl
        label="ID"
        hideLabelFromVision
        value={anchorId}
        onChange={(val) => setAttributes({ anchorId: val })}
      />
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="ARIA Label" isSet={isStylePropSet(attributes, 'ariaLabel')} />
      </div>
      <TextControl
        label="ARIA Label"
        hideLabelFromVision
        value={ariaLabel}
        onChange={(val) => setAttributes({ ariaLabel: val })}
      />
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Role" isSet={isStylePropSet(attributes, 'role')} />
      </div>
      <TextControl
        label="Role"
        hideLabelFromVision
        value={role}
        onChange={(val) => setAttributes({ role: val })}
      />
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Custom Attributes" isSet={isStylePropSet(attributes, 'customAttributes')} />
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

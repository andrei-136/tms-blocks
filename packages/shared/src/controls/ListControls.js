import React, { useState } from 'react';
import { PanelBody, SelectControl, TextControl, Button, ToggleControl } from '@wordpress/components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import ControlLabel from './ControlLabel';
import { isStylePropSet } from '../style-utils';

export default function ListControls({ customStyle = {}, updateCustomStyle, usePanelBody = true }) {
  const presetValues = ['', 'none', 'disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-greek', 'lower-alpha', 'upper-alpha'];
  const currentValue = customStyle.listStyleType || '';

  const isCustomValue = !!currentValue && !presetValues.includes(currentValue);
  const selectValue = isCustomValue ? 'custom' : currentValue;

  const [customMode, setCustomMode] = useState(isCustomValue);
  const [useCustomImage, setUseCustomImage] = useState(
    !!customStyle.listStyleImage
  );

  const showCustomInput = customMode || isCustomValue;

  const controls = (
    <>
      <SelectControl
        label={<ControlLabel label="List Style Type" isSet={isStylePropSet(customStyle, 'listStyleType')} />}
        value={showCustomInput ? 'custom' : selectValue}
        options={[
          { label: 'Default', value: '' },
          { label: 'None', value: 'none' },
          { label: 'Custom', value: 'custom' },
          { label: 'Disc', value: 'disc' },
          { label: 'Circle', value: 'circle' },
          { label: 'Square', value: 'square' },
          { label: 'Decimal', value: 'decimal' },
          { label: 'Decimal Leading Zero', value: 'decimal-leading-zero' },
          { label: 'Lower Roman', value: 'lower-roman' },
          { label: 'Upper Roman', value: 'upper-roman' },
          { label: 'Lower Greek', value: 'lower-greek' },
          { label: 'Lower Alpha', value: 'lower-alpha' },
          { label: 'Upper Alpha', value: 'upper-alpha' },
        ]}
        onChange={(value) => {
          if (value === 'custom') {
            setCustomMode(true);
          } else {
            setCustomMode(false);
            updateCustomStyle('listStyleType', value || null);
          }
        }}
      />
      {showCustomInput && (
        <TextControl
          label={<ControlLabel label="Custom List Style Type" isSet={isStylePropSet(customStyle, 'listStyleType')} />}
          value={currentValue}
          onChange={(value) => {
            updateCustomStyle('listStyleType', value || null);
          }}
          placeholder="e.g., lower-latin, '-> '"
          help="Enter any valid CSS list-style-type value"
        />
      )}
      <SelectControl
        label={<ControlLabel label="List Style Position" isSet={isStylePropSet(customStyle, 'listStylePosition')} />}
        value={customStyle.listStylePosition || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Outside', value: 'outside' },
          { label: 'Inside', value: 'inside' },
        ]}
        onChange={(value) => updateCustomStyle('listStylePosition', value || null)}
      />
      <ToggleControl
        label={<ControlLabel label="Custom Marker Image" isSet={isStylePropSet(customStyle, 'listStyleImage')} />}
        checked={useCustomImage}
        onChange={(value) => {
          setUseCustomImage(value);
          if (!value) {
            updateCustomStyle('listStyleImage', null);
          }
        }}
        help="Use a custom image as the list marker"
      />
      {useCustomImage && (
        <>
          <div style={{ marginBottom: '8px', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', color: '#1e1e1e' }}>List Style Image</div>
          <MediaUploadCheck>
            <MediaUpload
              onSelect={(media) => {
                const imageUrl = media.url || media.source_url;
                if (imageUrl) {
                  updateCustomStyle('listStyleImage', `url('${imageUrl}')`);
                }
              }}
              allowedTypes={['image']}
              render={({ open }) => (
                <Button
                  onClick={open}
                  variant="secondary"
                  style={{ marginBottom: '8px', width: '100%' }}
                >
                  {customStyle.listStyleImage ? 'Replace Image' : 'Select from Media Library'}
                </Button>
              )}
            />
          </MediaUploadCheck>
          <TextControl
            label={<ControlLabel label="Or enter URL" isSet={isStylePropSet(customStyle, 'listStyleImage')} />}
            value={customStyle.listStyleImage ? customStyle.listStyleImage.replace(/^url\(['"]?|['"]?\)$/g, '') : ''}
            onChange={(value) => updateCustomStyle('listStyleImage', value ? `url('${value}')` : null)}
            placeholder="https://example.com/marker.png"
            help="URL from media library or external web resource"
          />
        </>
      )}
    </>
  );

  if (!usePanelBody) {
    return controls;
  }

  return (
    <PanelBody title="List Controls" initialOpen={false}>
      {controls}
    </PanelBody>
  );
}

import React from 'react';
import { PanelBody, SelectControl, TextControl, Button } from '@wordpress/components';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

export default function ObjectControls({ customStyle, updateCustomStyle }) {
  const objectPositionPresets = [
    '',
    'center',
    'top',
    'bottom',
    'left',
    'right',
    'top left',
    'top right',
    'bottom left',
    'bottom right'
  ];

  const currentObjectPosition = customStyle.objectPosition || '';
  const isCustomObjectPosition =
    currentObjectPosition && !objectPositionPresets.includes(currentObjectPosition);
  const objectPositionSelectValue = isCustomObjectPosition
    ? 'custom'
    : currentObjectPosition;
  const isModified = hasModifiedStyleProps(customStyle, ['objectFit', 'objectPosition']);

  return (
    <PanelBody title={<PanelTitle title="Object Fit & Position" isModified={isModified} />} initialOpen={false}>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Object Fit" isSet={isStylePropSet(customStyle, 'objectFit')} />
      </div>
      <SelectControl
        label="Object Fit"
        hideLabelFromVision
        value={customStyle.objectFit || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
          { label: 'Fill', value: 'fill' },
          { label: 'None', value: 'none' },
          { label: 'Scale Down', value: 'scale-down' }
        ]}
        onChange={(val) => updateCustomStyle('objectFit', val || null)}
      />
      
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Object Position" isSet={isStylePropSet(customStyle, 'objectPosition')} />
      </div>
      <SelectControl
        label="Object Position"
        hideLabelFromVision
        value={objectPositionSelectValue}
        options={[
          { label: 'Default', value: '' },
          { label: 'Center', value: 'center' },
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
          { label: 'Top Left', value: 'top left' },
          { label: 'Top Right', value: 'top right' },
          { label: 'Bottom Left', value: 'bottom left' },
          { label: 'Bottom Right', value: 'bottom right' },
          { label: 'Custom', value: 'custom' }
        ]}
        onChange={(val) => {
          if (val === 'custom') {
            updateCustomStyle(
              'objectPosition',
              currentObjectPosition || '50% 50%'
            );
            return;
          }

          updateCustomStyle('objectPosition', val || null);
        }}
      />

      {objectPositionSelectValue === 'custom' && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Custom Object Position" isSet={isStylePropSet(customStyle, 'objectPosition')} />
          </div>
          <TextControl
            label="Custom Object Position"
            hideLabelFromVision
            value={isCustomObjectPosition ? currentObjectPosition : ''}
            placeholder="e.g. 50% 75%"
            onChange={(val) => updateCustomStyle('objectPosition', val || null)}
          />
        </>
      )}
      {isModified && (
        <Button
          variant="secondary"
          isDestructive
          onClick={() => updateCustomStyle({ objectFit: null, objectPosition: null })}
          style={{ marginTop: '8px' }}
        >
          Clear panel properties
        </Button>
      )}
    </PanelBody>
  );
}

import React from 'react';
import { PanelBody, SelectControl, Button } from '@wordpress/components';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

function FlexboxFields({ customStyle, updateCustomStyle }) {
  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Flex Direction" isSet={isStylePropSet(customStyle, 'flexDirection')} />
      </div>
      <SelectControl
        label="Flex Direction"
        hideLabelFromVision
        value={customStyle.flexDirection || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Row', value: 'row' },
          { label: 'Column', value: 'column' },
          { label: 'Row Reverse', value: 'row-reverse' },
          { label: 'Column Reverse', value: 'column-reverse' }
        ]}
        onChange={(val) => updateCustomStyle('flexDirection', val)}
      />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Justify Content" isSet={isStylePropSet(customStyle, 'justifyContent')} />
      </div>
      <SelectControl
        label="Justify Content"
        hideLabelFromVision
        value={customStyle.justifyContent || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Flex Start', value: 'flex-start' },
          { label: 'Center', value: 'center' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ]}
        onChange={(val) => updateCustomStyle('justifyContent', val)}
      />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Align Items" isSet={isStylePropSet(customStyle, 'alignItems')} />
      </div>
      <SelectControl
        label="Align Items"
        hideLabelFromVision
        value={customStyle.alignItems || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Stretch', value: 'stretch' },
          { label: 'Center', value: 'center' },
          { label: 'Flex Start', value: 'flex-start' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'Baseline', value: 'baseline' }
        ]}
        onChange={(val) => updateCustomStyle('alignItems', val)}
      />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Flex Wrap" isSet={isStylePropSet(customStyle, 'flexWrap')} />
      </div>
      <SelectControl
        label="Flex Wrap"
        hideLabelFromVision
        value={customStyle.flexWrap || ''}
        options={[
          { label: 'No Wrap', value: '' },
          { label: 'Wrap', value: 'wrap' },
          { label: 'Wrap Reverse', value: 'wrap-reverse' }
        ]}
        onChange={(val) => updateCustomStyle('flexWrap', val)}
      />
    </>
  );
}

export default function FlexboxControls({ customStyle, updateCustomStyle, inline = false, forceShow = false }) {
  const isFlex = ['flex', 'inline-flex'].includes(customStyle.display);
  const isModified = hasModifiedStyleProps(customStyle, [
    'flexDirection',
    'justifyContent',
    'alignItems',
    'flexWrap'
  ]);

  if (!isFlex && !forceShow) return null;

  if (inline) {
    return <FlexboxFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} />;
  }

  const handleClearPanel = () => {
    updateCustomStyle({
      flexDirection: null,
      justifyContent: null,
      alignItems: null,
      flexWrap: null,
    });
  };

  return (
    <PanelBody title={<PanelTitle title="Flexbox" isModified={isModified} />} initialOpen={false}>
      <FlexboxFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} />
      {isModified && (
        <Button
          variant="secondary"
          isDestructive
          onClick={handleClearPanel}
          style={{ marginTop: '8px' }}
        >
          Clear panel properties
        </Button>
      )}
    </PanelBody>
  );
}

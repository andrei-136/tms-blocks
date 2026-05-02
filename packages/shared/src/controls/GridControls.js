import React from 'react';
import { PanelBody, TextControl, SelectControl, Button } from '@wordpress/components';
import ControlLabel from './ControlLabel';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

function GridFields({ customStyle = {}, updateCustomStyle }) {
  return (
    <>
      <TextControl
        label={<ControlLabel label="Grid Template Columns" isSet={isStylePropSet(customStyle, 'gridTemplateColumns')} />}
        value={customStyle.gridTemplateColumns || ''}
        onChange={(val) => updateCustomStyle('gridTemplateColumns', val || null)}
        placeholder="e.g., repeat(3, 1fr) or 200px 1fr 2fr"
        
      />

      <TextControl
        label={<ControlLabel label="Grid Template Rows" isSet={isStylePropSet(customStyle, 'gridTemplateRows')} />}
        value={customStyle.gridTemplateRows || ''}
        onChange={(val) => updateCustomStyle('gridTemplateRows', val || null)}
        placeholder="e.g., auto 1fr auto or repeat(2, 200px)"
        
      />

      <TextControl
        label={<ControlLabel label="Grid Template Areas" isSet={isStylePropSet(customStyle, 'gridTemplateAreas')} />}
        value={customStyle.gridTemplateAreas || ''}
        onChange={(val) => updateCustomStyle('gridTemplateAreas', val || null)}
        placeholder='e.g., "header header" "sidebar main" "footer footer"'
        
      />

      <SelectControl
        label={<ControlLabel label="Grid Auto Flow" isSet={isStylePropSet(customStyle, 'gridAutoFlow')} />}
        value={customStyle.gridAutoFlow || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Row', value: 'row' },
          { label: 'Column', value: 'column' },
          { label: 'Dense', value: 'dense' },
          { label: 'Row Dense', value: 'row dense' },
          { label: 'Column Dense', value: 'column dense' }
        ]}
        onChange={(val) => updateCustomStyle('gridAutoFlow', val || null)}
        
      />

      <SelectControl
        label={<ControlLabel label="Justify Items" isSet={isStylePropSet(customStyle, 'justifyItems')} />}
        value={customStyle.justifyItems || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' }
        ]}
        onChange={(val) => updateCustomStyle('justifyItems', val || null)}
        
      />

      <SelectControl
        label={<ControlLabel label="Align Items" isSet={isStylePropSet(customStyle, 'alignItems')} />}
        value={customStyle.alignItems || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' }
        ]}
        onChange={(val) => updateCustomStyle('alignItems', val || null)}
        
      />

      <SelectControl
        label={<ControlLabel label="Justify Content" isSet={isStylePropSet(customStyle, 'justifyContent')} />}
        value={customStyle.justifyContent || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Center', value: 'center' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ]}
        onChange={(val) => updateCustomStyle('justifyContent', val || null)}
        
      />

      <SelectControl
        label={<ControlLabel label="Align Content" isSet={isStylePropSet(customStyle, 'alignContent')} />}
        value={customStyle.alignContent || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Center', value: 'center' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ]}
        onChange={(val) => updateCustomStyle('alignContent', val || null)}
        
      />
    </>
  );
}

export default function GridControls({ customStyle = {}, updateCustomStyle, inline = false, forceShow = false }) {
  // Only show if display is set to grid
  const isGrid = customStyle.display === 'grid' || customStyle.display === 'inline-grid';

  if (!isGrid && !forceShow) return null;

  if (inline) {
    return <GridFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} />;
  }

  const isModified = hasModifiedStyleProps(customStyle, [
    'gridTemplateColumns',
    'gridTemplateRows',
    'gridTemplateAreas',
    'gridAutoFlow',
    'justifyItems',
    'alignItems',
    'justifyContent',
    'alignContent'
  ]);

  const handleClearPanel = () => {
    updateCustomStyle({
      gridTemplateColumns: null,
      gridTemplateRows: null,
      gridTemplateAreas: null,
      gridAutoFlow: null,
      justifyItems: null,
      alignItems: null,
      justifyContent: null,
      alignContent: null,
    });
  };

  return (
    <PanelBody title="Grid Layout" initialOpen={false}>
      <GridFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} />
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

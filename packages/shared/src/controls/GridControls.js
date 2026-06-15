import React from 'react';
import { PanelBody, TextControl, SelectControl, Button } from '@wordpress/components';
import ControlLabel from './ControlLabel';
import { getModificationLevel } from '../style-utils';

function GridFields({ customStyle = {}, updateCustomStyle, getLevel }) {
  return (
    <>
      <TextControl
        label={<ControlLabel label="Grid Template Columns" level={getLevel('gridTemplateColumns')} />}
        value={customStyle.gridTemplateColumns || ''}
        onChange={(val) => updateCustomStyle('gridTemplateColumns', val || null)}
        placeholder="e.g., repeat(3, 1fr) or 200px 1fr 2fr"
        
      />

      <TextControl
        label={<ControlLabel label="Grid Template Rows" level={getLevel('gridTemplateRows')} />}
        value={customStyle.gridTemplateRows || ''}
        onChange={(val) => updateCustomStyle('gridTemplateRows', val || null)}
        placeholder="e.g., auto 1fr auto or repeat(2, 200px)"
        
      />

      <TextControl
        label={<ControlLabel label="Grid Template Areas" level={getLevel('gridTemplateAreas')} />}
        value={customStyle.gridTemplateAreas || ''}
        onChange={(val) => updateCustomStyle('gridTemplateAreas', val || null)}
        placeholder='e.g., "header header" "sidebar main" "footer footer"'
        
      />

      <SelectControl
        label={<ControlLabel label="Grid Auto Flow" level={getLevel('gridAutoFlow')} />}
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
        label={<ControlLabel label="Justify Items" level={getLevel('justifyItems')} />}
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
        label={<ControlLabel label="Align Items" level={getLevel('alignItems')} />}
        value={customStyle.alignItems || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Flex Start', value: 'flex-start' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' },
          { label: 'Baseline', value: 'baseline' }
        ]}
        onChange={(val) => updateCustomStyle('alignItems', val || null)}
        
      />

      <SelectControl
        label={<ControlLabel label="Justify Content" level={getLevel('justifyContent')} />}
        value={customStyle.justifyContent || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Flex Start', value: 'flex-start' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ]}
        onChange={(val) => updateCustomStyle('justifyContent', val || null)}
        
      />

      <SelectControl
        label={<ControlLabel label="Align Content" level={getLevel('alignContent')} />}
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

export default function GridControls({ customStyle = {}, updateCustomStyle, inline = false, forceShow = false, masterStyle = null }) {
  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const gridProps = ['gridTemplateColumns','gridTemplateRows','gridTemplateAreas','gridAutoFlow','justifyItems','alignItems','justifyContent','alignContent'];
  const gridLevel = getModificationLevel(customStyle, gridProps, masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;
  const isGrid = customStyle.display === 'grid' || customStyle.display === 'inline-grid';

  if (!isGrid && !forceShow) return null;

  if (inline) {
    return <GridFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} getLevel={getLevel} />;
  }

  const isModified = gridLevel > 0;

  const handleClearPanel = () => {
    updateCustomStyle({
      gridTemplateColumns: resetToMaster('gridTemplateColumns'),
      gridTemplateRows: resetToMaster('gridTemplateRows'),
      gridTemplateAreas: resetToMaster('gridTemplateAreas'),
      gridAutoFlow: resetToMaster('gridAutoFlow'),
      justifyItems: resetToMaster('justifyItems'),
      alignItems: resetToMaster('alignItems'),
      justifyContent: resetToMaster('justifyContent'),
      alignContent: resetToMaster('alignContent'),
    });
  };

  return (
    <PanelBody title="Grid Layout" initialOpen={false}>
      <GridFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} getLevel={getLevel} />
      {isModified && (
        <Button
          variant="secondary"
          isDestructive
          onClick={handleClearPanel}
          style={{ marginTop: '8px' }}
        >
          {clearLabel} panel properties
        </Button>
      )}
    </PanelBody>
  );
}

import React from 'react';
import { PanelBody, SelectControl, Button } from '@wordpress/components';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { getModificationLevel } from '../style-utils';

function FlexboxFields({ customStyle, updateCustomStyle, getLevel }) {
  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Flex Direction" level={getLevel('flexDirection')} />
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
        <ControlLabel label="Justify Content" level={getLevel('justifyContent')} />
      </div>
      <SelectControl
        label="Justify Content"
        hideLabelFromVision
        value={customStyle.justifyContent || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Flex Start', value: 'flex-start' },
          { label: 'Start', value: 'start' },
          { label: 'Center', value: 'center' },
          { label: 'End', value: 'end' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'Space Between', value: 'space-between' },
          { label: 'Space Around', value: 'space-around' },
          { label: 'Space Evenly', value: 'space-evenly' }
        ]}
        onChange={(val) => updateCustomStyle('justifyContent', val)}
      />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Align Items" level={getLevel('alignItems')} />
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
          { label: 'Start', value: 'start' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'End', value: 'end' },
          { label: 'Baseline', value: 'baseline' }
        ]}
        onChange={(val) => updateCustomStyle('alignItems', val)}
      />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Flex Wrap" level={getLevel('flexWrap')} />
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

export default function FlexboxControls({ customStyle, updateCustomStyle, inline = false, forceShow = false, masterStyle = null }) {
  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const flexProps = ['flexDirection', 'justifyContent', 'alignItems', 'flexWrap'];
  const flexLevel = getModificationLevel(customStyle, flexProps, masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;
  const isFlex = ['flex', 'inline-flex'].includes(customStyle.display);
  const isModified = flexLevel > 0;

  if (!isFlex && !forceShow) return null;

  if (inline) {
    return <FlexboxFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} getLevel={getLevel} />;
  }

  const handleClearPanel = () => {
    updateCustomStyle({
      flexDirection: resetToMaster('flexDirection'),
      justifyContent: resetToMaster('justifyContent'),
      alignItems: resetToMaster('alignItems'),
      flexWrap: resetToMaster('flexWrap'),
    });
  };

  return (
    <PanelBody title={<PanelTitle title="Flexbox" level={flexLevel} />} initialOpen={false}>
      <FlexboxFields customStyle={customStyle} updateCustomStyle={updateCustomStyle} getLevel={getLevel} />
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

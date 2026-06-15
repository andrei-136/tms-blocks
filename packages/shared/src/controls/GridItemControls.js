import React, { useEffect, useState } from 'react';
import { PanelBody, SelectControl, TextControl, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { getModificationLevel } from '../style-utils';

const getUnitlessValue = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value.value !== undefined) {
    return value.value ?? '';
  }
  return value;
};

export default function GridItemControls({
  clientId,
  customStyle = {},
  updateCustomStyle,
  forceShow = false,
  inline = false,
  masterStyle = null
}) {
  const isParentGrid = useSelect((select) => {
    if (!clientId) return false;
    const { getBlockRootClientId, getBlock } = select(blockEditorStore);
    const parentId = getBlockRootClientId(clientId);
    if (!parentId) return false;
    
    const parentBlock = getBlock(parentId);
    const parentStyle = parentBlock?.attributes?.customStyle || {};
    const parentUtilities = parentBlock?.attributes?.utilityClasses || '';
    const display = parentStyle.display;
    const classList = parentUtilities.split(/\s+/).filter(Boolean);

    

    return display === 'grid'
      || display === 'inline-grid'
      || classList.includes('tmsblocks-display-grid');
  }, [clientId]);

  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const gridProps = ['justifySelf','alignSelf','order','gridColumn','gridRow','gridArea'];

  const hasGridItemOverrides = gridProps.some((p) => getLevel(p) >= (masterStyle ? 3 : 1));

  const [stayVisibleWhileSelected, setStayVisibleWhileSelected] = useState(false);

  useEffect(() => {
    setStayVisibleWhileSelected(false);
  }, [clientId]);

  useEffect(() => {
    if (isParentGrid || forceShow || hasGridItemOverrides) {
      setStayVisibleWhileSelected(true);
    }
  }, [isParentGrid, forceShow, hasGridItemOverrides]);

  const shouldShowPanel = isParentGrid || forceShow || hasGridItemOverrides || stayVisibleWhileSelected;

  const orderValue = getUnitlessValue(customStyle.order);

  const handleUnitlessChange = (prop) => (val) => {
    if (val === '') {
      updateCustomStyle(prop, null);
      return;
    }

    if (/^-?\d*\.?\d*$/.test(val)) {
      updateCustomStyle(prop, val, 'unitless');
    }
  };

  const fields = (
    <>
      
      
      
     
      
      {/* Justify Self */}
      <SelectControl
        label={<ControlLabel label="Justify Self" level={getLevel('justifySelf')} />}
        value={customStyle.justifySelf || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Auto', value: 'auto' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' }
        ]}
        onChange={(val) => updateCustomStyle('justifySelf', val || null)}
        
      />
      
      {/* Align Self */}
      <SelectControl
        label={<ControlLabel label="Align Self" level={getLevel('alignSelf')} />}
        value={customStyle.alignSelf || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Auto', value: 'auto' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' }
        ]}
        onChange={(val) => updateCustomStyle('alignSelf', val || null)}
        
      />
      
      {/* Order */}
      <TextControl
        label={<ControlLabel label="Order" level={getLevel('order')} />}
        value={orderValue}
        onChange={handleUnitlessChange('order')}
        
      />

       <hr style={{ margin: '16px 0', borderTop: '1px solid #ddd' }} />
       
      {/* Grid Column */}
      <TextControl
        label={<ControlLabel label="Grid Column" level={getLevel('gridColumn')} />}
        value={customStyle.gridColumn || ''}
        onChange={(val) => updateCustomStyle('gridColumn', val || null)}
        placeholder="e.g., 1 / 3, span 2, 2 / -1"
        
      />
      
      {/* Grid Row */}
      <TextControl
        label={<ControlLabel label="Grid Row" level={getLevel('gridRow')} />}
        value={customStyle.gridRow || ''}
        onChange={(val) => updateCustomStyle('gridRow', val || null)}
        placeholder="e.g., 1 / 3, span 2, 2 / -1"
        
      />
      
      {/* Grid Area */}
      <TextControl
        label={<ControlLabel label="Grid Area" level={getLevel('gridArea')} />}
        value={customStyle.gridArea || ''}
        onChange={(val) => updateCustomStyle('gridArea', val || null)}
        placeholder="e.g., header"
        
      />
    </>
  );

  if (inline) {
    return fields;
  }

  if (!shouldShowPanel) return null;

  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;

  return (
    <PanelBody title={<PanelTitle title="Grid Item" level={getModificationLevel(customStyle, gridProps, masterStyle)} />} initialOpen={false}>
      {fields}
      {hasGridItemOverrides && (
        <Button
          variant="secondary"
          isDestructive
          onClick={() => updateCustomStyle({
            justifySelf: resetToMaster('justifySelf'),
            alignSelf: resetToMaster('alignSelf'),
            order: resetToMaster('order'),
            gridColumn: resetToMaster('gridColumn'),
            gridRow: resetToMaster('gridRow'),
            gridArea: resetToMaster('gridArea'),
          })}
          style={{ marginTop: '8px' }}
        >
          {clearLabel} panel properties
        </Button>
      )}
    </PanelBody>
  );
}

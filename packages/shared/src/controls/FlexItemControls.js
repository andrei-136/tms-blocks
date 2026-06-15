import React, { useState } from 'react';
import { PanelBody, SelectControl, TextControl, Button, Flex, FlexItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import UnitControls, { KEYWORDS_GLOBAL, KEYWORDS_SIZING } from './UnitControls';
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

export default function FlexItemControls({
  clientId,
  customStyle = {},
  updateCustomStyle,
  forceShow = false,
  inline = false,
  masterStyle = null
}) {
  const isParentFlex = useSelect((select) => {
    if (!clientId) return false;
    const { getBlockRootClientId, getBlock } = select(blockEditorStore);
    const parentId = getBlockRootClientId(clientId);
    if (!parentId) return false;

    const parentBlock = getBlock(parentId);
    const parentStyle = parentBlock?.attributes?.customStyle || {};
    const display = parentStyle.display;

    return display === 'flex' || display === 'inline-flex';
  }, [clientId]);

  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);

  const hasFlexItemOverrides = getModificationLevel(customStyle, [
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'alignSelf',
    'order'
  ], masterStyle) > 0;

  const shouldShowPanel = isParentFlex || forceShow || hasFlexItemOverrides;

  const flexGrowValue = getUnitlessValue(customStyle.flexGrow);
  const flexShrinkValue = getUnitlessValue(customStyle.flexShrink);
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

  const handleBasisChange = (val) => {
    const nextValue = val && typeof val === 'object' ? val : null;
    updateCustomStyle({ flexBasis: nextValue });
  };

  const fields = (
    <>
      <Flex gap={3}>
        <FlexItem>
          <TextControl
            label={<ControlLabel label="Flex Grow" level={getLevel('flexGrow')} />}
            value={flexGrowValue}
            onChange={handleUnitlessChange('flexGrow')}
          />
        </FlexItem>
        <FlexItem>
          <TextControl
            label={<ControlLabel label="Flex Shrink" level={getLevel('flexShrink')} />}
            value={flexShrinkValue}
            onChange={handleUnitlessChange('flexShrink')}
          />
        </FlexItem>
      </Flex>

      <UnitControls
            label={<ControlLabel label="Flex Basis" level={getLevel('flexBasis')} />}
        value={customStyle.flexBasis}
        onChange={handleBasisChange}
        allowedUnits={['px', 'rem', 'em', '%', 'vw', 'vh', 'custom', 'size-presets', 'layout-presets', 'keywords']}
        keywords={[...KEYWORDS_SIZING, ...KEYWORDS_GLOBAL]}
      />

      <hr style={{ margin: '16px 0', borderTop: '1px solid #ddd' }} />

      <SelectControl
        label={<ControlLabel label="Align Self" level={getLevel('alignSelf')} />}
        value={customStyle.alignSelf || ''}
        options={[
          { label: 'Auto (default)', value: '' },
          { label: 'Flex Start', value: 'flex-start' },
          { label: 'Flex End', value: 'flex-end' },
          { label: 'Center', value: 'center' },
          { label: 'Baseline', value: 'baseline' },
          { label: 'Stretch', value: 'stretch' }
        ]}
        onChange={(val) => updateCustomStyle('alignSelf', val || null)}
      />

      <TextControl
        label={<ControlLabel label="Order" level={getLevel('order')} />}
        value={orderValue}
        onChange={handleUnitlessChange('order')}
      />
    </>
  );

  if (inline) {
    return fields;
  }

  if (!shouldShowPanel) return null;

  return (
    <PanelBody title={<PanelTitle title="Flex Item" level={getModificationLevel(customStyle, ['flexGrow','flexShrink','flexBasis','alignSelf','order'], masterStyle)} />} initialOpen={false}>
      {fields}
      {hasFlexItemOverrides && (
        <Button
          variant="secondary"
          isDestructive
          onClick={() => updateCustomStyle({
            flexGrow: null,
            flexShrink: null,
            flexBasis: null,
            alignSelf: null,
            order: null,
          })}
          style={{ marginTop: '8px' }}
        >
          Clear panel properties
        </Button>
      )}
    </PanelBody>
  );
}

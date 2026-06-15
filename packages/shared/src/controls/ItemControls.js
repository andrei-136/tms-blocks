import React, { useEffect, useState } from 'react';
import { PanelBody, ButtonGroup, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import PanelTitle from './PanelTitle';
import FlexItemControls from './FlexItemControls';
import GridItemControls from './GridItemControls';
import ControlLabel from './ControlLabel';
import { getModificationLevel, MODIFICATION_LEVEL_COLORS } from '../style-utils';

const FLEX_ITEM_PROPS = ['flexGrow', 'flexShrink', 'flexBasis'];
const GRID_ITEM_PROPS = ['justifySelf', 'gridColumn', 'gridRow', 'gridArea'];
const SHARED_ITEM_PROPS = ['alignSelf', 'order'];
const ITEM_PANEL_STYLE_KEYS = [...FLEX_ITEM_PROPS, ...GRID_ITEM_PROPS, ...SHARED_ITEM_PROPS];

const ITEM_PROP_LABELS = {
  flexGrow: 'Flex Grow',
  flexShrink: 'Flex Shrink',
  flexBasis: 'Flex Basis',
  justifySelf: 'Justify Self',
  gridColumn: 'Grid Column',
  gridRow: 'Grid Row',
  gridArea: 'Grid Area',
  alignSelf: 'Align Self',
  order: 'Order',
};

export default function ItemControls({
  clientId,
  customStyle = {},
  updateCustomStyle,
  allowFlexItem = true,
  allowGridItem = true,
  masterStyle = null,
}) {
  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;
  const { isParentFlex, isParentGrid } = useSelect((select) => {
    if (!clientId) return { isParentFlex: false, isParentGrid: false };

    const { getBlockRootClientId, getBlock } = select(blockEditorStore);
    const parentId = getBlockRootClientId(clientId);
    if (!parentId) return { isParentFlex: false, isParentGrid: false };

    const parentBlock = getBlock(parentId);
    const parentStyle = parentBlock?.attributes?.customStyle || {};
    const parentUtilities = parentBlock?.attributes?.utilityClasses || '';
    const display = parentStyle.display;
    const classList = parentUtilities.split(/\s+/).filter(Boolean);

    return {
      isParentFlex:
        display === 'flex' ||
        display === 'inline-flex' ||
        classList.includes('tmsblocks-display-flex') ||
        classList.includes('tmsblocks-display-inline-flex'),
      isParentGrid:
        display === 'grid' ||
        display === 'inline-grid' ||
        classList.includes('tmsblocks-display-grid')
    };
  }, [clientId]);

  const hasFlexOverrides = FLEX_ITEM_PROPS.some((p) => getLevel(p) >= (masterStyle ? 3 : 1));
  const hasGridOverrides = GRID_ITEM_PROPS.some((p) => getLevel(p) >= (masterStyle ? 3 : 1));
  const hasSharedOverrides = SHARED_ITEM_PROPS.some((p) => getLevel(p) >= (masterStyle ? 3 : 1));

  const inferInitialMode = () => {
    if (allowFlexItem && !allowGridItem) return 'flex';
    if (!allowFlexItem && allowGridItem) return 'grid';
    if (hasFlexOverrides && !hasGridOverrides) return 'flex';
    if (hasGridOverrides && !hasFlexOverrides) return 'grid';
    if (isParentFlex && !isParentGrid) return 'flex';
    if (isParentGrid && !isParentFlex) return 'grid';
    return 'flex';
  };

  const [itemMode, setItemMode] = useState(inferInitialMode);
  const showFlexSection = allowFlexItem && itemMode === 'flex';
  const showGridSection = allowGridItem && itemMode === 'grid';
  const isModified = hasFlexOverrides || hasGridOverrides || hasSharedOverrides;

  const setProps = ITEM_PANEL_STYLE_KEYS.filter((key) => getLevel(key) >= 1);
  const hiddenSetProps = showFlexSection
    ? setProps.filter((key) => GRID_ITEM_PROPS.includes(key))
    : showGridSection
      ? setProps.filter((key) => FLEX_ITEM_PROPS.includes(key))
      : [];

  useEffect(() => {
    if (!allowFlexItem && itemMode === 'flex') {
      setItemMode('grid');
    }
    if (!allowGridItem && itemMode === 'grid') {
      setItemMode('flex');
    }
  }, [allowFlexItem, allowGridItem, itemMode]);

  const handleClearPanel = () => {
    const resetValues = {};
    setProps.forEach((key) => { resetValues[key] = resetToMaster(key); });
    updateCustomStyle(resetValues);
  };

  return (
    <PanelBody title={<PanelTitle title="Flex/Grid Item" level={getModificationLevel(customStyle, ITEM_PANEL_STYLE_KEYS, masterStyle)} />} initialOpen={false}>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Item Type
          </label>
          <ButtonGroup style={{ width: '100%', display: 'flex' }}>
            <Button
              variant={itemMode === 'flex' ? 'primary' : 'secondary'}
              onClick={() => setItemMode('flex')}
              style={{ flex: 1 }}
            >
              <ControlLabel label="Flex Item" level={hasFlexOverrides ? 3 : (hasSharedOverrides ? 1 : 0)} />
            </Button>
            <Button
              variant={itemMode === 'grid' ? 'primary' : 'secondary'}
              onClick={() => setItemMode('grid')}
              style={{ flex: 1 }}
            >
              <ControlLabel label="Grid Item" level={hasGridOverrides ? 3 : (hasSharedOverrides ? 1 : 0)} />
            </Button>
          </ButtonGroup>
        </div>

      {showFlexSection && (
        <FlexItemControls
          clientId={clientId}
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          inline
          forceShow
          masterStyle={masterStyle}
        />
      )}

      {showGridSection && (
        <GridItemControls
          clientId={clientId}
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          inline
          forceShow
          masterStyle={masterStyle}
        />
      )}
      {isModified && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {setProps.map((key) => {
              const isHidden = hiddenSetProps.includes(key);
              const modeLabel = FLEX_ITEM_PROPS.includes(key)
                ? 'Flex'
                : GRID_ITEM_PROPS.includes(key)
                  ? 'Grid'
                  : 'Shared';

              return (
                <span
                  key={key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    background: isHidden ? '#f6f7f7' : '#f0f0f0',
                    borderRadius: '2px',
                    padding: '2px 6px',
                    color: '#1e1e1e',
                    opacity: isHidden ? 0.8 : 1,
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '999px',
                      backgroundColor: MODIFICATION_LEVEL_COLORS[getLevel(key)] || MODIFICATION_LEVEL_COLORS[1],
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  {ITEM_PROP_LABELS[key] ?? key}
                  {modeLabel !== 'Shared' ? ` · ${modeLabel}` : ''}
                  {isHidden ? ' (hidden)' : ''}
                  <button
                    onClick={() => updateCustomStyle(key, resetToMaster(key))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 0 0 2px',
                      lineHeight: 1,
                      color: '#757575',
                      fontSize: '12px',
                    }}
                    aria-label={`${clearLabel} ${ITEM_PROP_LABELS[key] ?? key}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>

         

          <Button
            variant="secondary"
            isDestructive
            onClick={handleClearPanel}
          >
            {clearLabel} panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

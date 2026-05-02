import React, { useEffect, useState } from 'react';
import { PanelBody, ButtonGroup, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import PanelTitle from './PanelTitle';
import FlexItemControls from './FlexItemControls';
import GridItemControls from './GridItemControls';
import ControlLabel from './ControlLabel';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

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
}) {
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

  const hasFlexOverrides = hasModifiedStyleProps(customStyle, FLEX_ITEM_PROPS);
  const hasGridOverrides = hasModifiedStyleProps(customStyle, GRID_ITEM_PROPS);
  const hasSharedOverrides = hasModifiedStyleProps(customStyle, SHARED_ITEM_PROPS);

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

  const setProps = ITEM_PANEL_STYLE_KEYS.filter((key) => isStylePropSet(customStyle, key));
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
    const clearMap = ITEM_PANEL_STYLE_KEYS.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});

    updateCustomStyle(clearMap);
  };

  return (
    <PanelBody title={<PanelTitle title="Flex/Grid Item" isModified={isModified} />} initialOpen={false}>
      {allowFlexItem && allowGridItem && (
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
              <ControlLabel label="Flex Item" isSet={hasFlexOverrides || hasSharedOverrides} />
            </Button>
            <Button
              variant={itemMode === 'grid' ? 'primary' : 'secondary'}
              onClick={() => setItemMode('grid')}
              style={{ flex: 1 }}
            >
              <ControlLabel label="Grid Item" isSet={hasGridOverrides || hasSharedOverrides} />
            </Button>
          </ButtonGroup>
        </div>
      )}

      {showFlexSection && (
        <FlexItemControls
          clientId={clientId}
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          inline
          forceShow
        />
      )}

      {showGridSection && (
        <GridItemControls
          clientId={clientId}
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          inline
          forceShow
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
                      backgroundColor: 'var(--wp-admin-theme-color, #007cba)',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  {ITEM_PROP_LABELS[key] ?? key}
                  {modeLabel !== 'Shared' ? ` · ${modeLabel}` : ''}
                  {isHidden ? ' (hidden)' : ''}
                  <button
                    onClick={() => updateCustomStyle(key, null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 0 0 2px',
                      lineHeight: 1,
                      color: '#757575',
                      fontSize: '12px',
                    }}
                    aria-label={`Unset ${ITEM_PROP_LABELS[key] ?? key}`}
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
            Clear panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

import { PanelBody, SelectControl, Button, ToggleControl, Flex, FlexItem } from '@wordpress/components';
import { useState, useEffect, useRef } from '@wordpress/element';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import FlexboxControls from './FlexboxControls';
import GridControls from './GridControls';
import { getModificationLevel, MODIFICATION_LEVEL_COLORS } from '../style-utils';

const FLEX_PROPS = ['flexDirection', 'flexWrap'];
const GRID_PROPS = ['gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas', 'gridAutoFlow', 'justifyItems', 'alignContent'];
const SHARED_PROPS = ['justifyContent', 'alignItems'];

const DISPLAY_PANEL_STYLE_KEYS = [
  'display',
  'overflowX',
  'overflowY',
  'cursor',
  ...FLEX_PROPS,
  ...GRID_PROPS,
  ...SHARED_PROPS,
];

const PROP_LABELS = {
  display: 'Display',
  overflowX: 'Overflow X',
  overflowY: 'Overflow Y',
  cursor: 'Cursor',
  flexDirection: 'Flex Direction',
  flexWrap: 'Flex Wrap',
  justifyContent: 'Justify Content',
  alignItems: 'Align Items',
  gridTemplateColumns: 'Grid Template Columns',
  gridTemplateRows: 'Grid Template Rows',
  gridTemplateAreas: 'Grid Template Areas',
  gridAutoFlow: 'Grid Auto Flow',
  justifyItems: 'Justify Items',
  alignContent: 'Align Content',
};

const displayOptions = [
  { label: 'Default', value: '' },
  { label: 'Block', value: 'block' },
  { label: 'Flex', value: 'flex' },
  { label: 'Grid', value: 'grid' },
  { label: 'Inline', value: 'inline' },
  { label: 'Inline Block', value: 'inline-block' },
  { label: 'Inline Flex', value: 'inline-flex' },
  { label: 'Contents', value: 'contents' },
  { label: 'None (Hidden)', value: 'none' }
];

export default function DisplayControls({
  customStyle = {},
  updateCustomStyle,
  showCursor = false,
  masterStyle = null
}) {
  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;
  const currentDisplay = typeof customStyle.display === 'string' ? customStyle.display : '';

  const isFlexDisplay = ['flex', 'inline-flex'].includes(currentDisplay);
  const isGridDisplay = ['grid', 'inline-grid'].includes(currentDisplay);

  const hasFlexOverrides = getLevel('flexDirection') >= 3 || getLevel('flexWrap') >= 3;
  const hasGridOverrides = ['gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas', 'gridAutoFlow', 'justifyItems', 'alignContent']
    .some((p) => getLevel(p) >= (masterStyle ? 3 : 1));

  const shouldShowFlexPanel = isFlexDisplay;
  const shouldShowGridPanel = isGridDisplay;

  const overriddenProps = DISPLAY_PANEL_STYLE_KEYS.filter(
    (p) => getLevel(p) >= (masterStyle ? 3 : 1)
  );
  const hasOverrides = overriddenProps.length > 0;

  const handleDisplayChange = (value) => {
    updateCustomStyle({ display: value || null });
  };

  // --- Linked overflowX / overflowY (same pattern as SpacingControls) ---

  const overflowOptions = [
    { label: 'Default', value: '' },
    { label: 'Visible', value: 'visible' },
    { label: 'Hidden', value: 'hidden' },
    { label: 'Scroll', value: 'scroll' },
    { label: 'Auto', value: 'auto' },
    { label: 'Clip', value: 'clip' },
  ];

  const [linkOverflow, setLinkOverflow] = useState(() =>
    (customStyle.overflowX || '') === (customStyle.overflowY || '')
  );

  const prevCustomStyleRef = useRef(customStyle);

  useEffect(() => {
    if (prevCustomStyleRef.current !== customStyle) {
      setLinkOverflow((customStyle.overflowX || '') === (customStyle.overflowY || ''));
      prevCustomStyleRef.current = customStyle;
    }
  }, [customStyle]);

  const handleLinkOverflow = (enabled) => {
    setLinkOverflow(enabled);
    if (enabled) {
      const linkedValue = customStyle.overflowX || customStyle.overflowY || null;
      updateCustomStyle({ overflowX: linkedValue, overflowY: linkedValue });
    }
  };

  const handleOverflowChange = (val) => {
    const value = val || null;
    if (linkOverflow) {
      updateCustomStyle({ overflowX: value, overflowY: value });
    } else {
      // Called from the linked row only
      updateCustomStyle({ overflowX: value, overflowY: value });
    }
  };

  const handleOverflowXChange = (val) => {
    updateCustomStyle('overflowX', val || null);
  };

  const handleOverflowYChange = (val) => {
    updateCustomStyle('overflowY', val || null);
  };

  const handleClearPanel = () => {
    const resetValues = {};
    overriddenProps.forEach((p) => { resetValues[p] = resetToMaster(p); });
    updateCustomStyle(resetValues);
  };

  return (
    <PanelBody title={<PanelTitle title="Display & Layout" level={getModificationLevel(customStyle, DISPLAY_PANEL_STYLE_KEYS, masterStyle)} />} initialOpen={false}>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Display" level={getLevel('display')} />
      </div>
      <SelectControl
        label="Display"
        hideLabelFromVision
        value={currentDisplay}
        options={displayOptions}
        onChange={handleDisplayChange}
      />

      {shouldShowFlexPanel && (
        <FlexboxControls
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          forceShow={hasFlexOverrides}
          inline
          masterStyle={masterStyle}
        />
      )}

      {shouldShowGridPanel && (
        <GridControls
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          forceShow={hasGridOverrides}
          inline
          masterStyle={masterStyle}
        />
      )}

      <div style={{ marginBottom: '8px', marginTop: '4px' }}>
        <Flex align="center" justify="space-between" style={{ fontSize: '11px', color: '#757575', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>
            <ControlLabel
              label="Overflow"
              level={Math.max(getLevel('overflowX'), getLevel('overflowY'))}
            />
          </span>
          <ToggleControl
            label=""
            checked={linkOverflow}
            onChange={handleLinkOverflow}
            __nextHasNoMarginBottom
            style={{ marginBottom: 0 }}
          />
        </Flex>

        {linkOverflow ? (
          <SelectControl
            label="Overflow"
            hideLabelFromVision
            value={customStyle.overflowX || ''}
            options={overflowOptions}
            onChange={handleOverflowChange}
          />
        ) : (
          <>
            <div style={{ marginBottom: '4px' }}>
              <ControlLabel label="Overflow X" level={getLevel('overflowX')} />
            </div>
            <SelectControl
              label="Overflow X"
              hideLabelFromVision
              value={customStyle.overflowX || ''}
              options={overflowOptions}
              onChange={handleOverflowXChange}
            />
            <div style={{ marginBottom: '4px', marginTop: '4px' }}>
              <ControlLabel label="Overflow Y" level={getLevel('overflowY')} />
            </div>
            <SelectControl
              label="Overflow Y"
              hideLabelFromVision
              value={customStyle.overflowY || ''}
              options={overflowOptions}
              onChange={handleOverflowYChange}
            />
          </>
        )}
      </div>

      {showCursor && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Cursor" level={getLevel('cursor')} />
          </div>
          <SelectControl
            label="Cursor"
            hideLabelFromVision
            value={customStyle.cursor || ''}
            options={[
              { label: 'Default', value: '' },
              { label: 'Pointer', value: 'pointer' },
              { label: 'Default (arrow)', value: 'default' },
              { label: 'Not Allowed', value: 'not-allowed' },
              { label: 'Grab', value: 'grab' },
              { label: 'Zoom In', value: 'zoom-in' },
              { label: 'Text', value: 'text' },
              { label: 'None', value: 'none' },
            ]}
            onChange={(val) => updateCustomStyle('cursor', val || null)}
          />
        </>
      )}

      {hasOverrides && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {overriddenProps.map((key) => (
              <span
                key={key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  background: '#f0f0f0',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  color: '#1e1e1e',
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
                {PROP_LABELS[key] ?? key}
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
                  aria-label={`${clearLabel} ${PROP_LABELS[key] ?? key}`}
                >
                  ×
                </button>
              </span>
            ))}
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

import { PanelBody, SelectControl, Button } from '@wordpress/components';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import FlexboxControls from './FlexboxControls';
import GridControls from './GridControls';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

const FLEX_PROPS = ['flexDirection', 'flexWrap'];
const GRID_PROPS = ['gridTemplateColumns', 'gridTemplateRows', 'gridTemplateAreas', 'gridAutoFlow', 'justifyItems', 'alignContent'];
const SHARED_PROPS = ['justifyContent', 'alignItems'];

const DISPLAY_PANEL_STYLE_KEYS = [
  'display',
  'overflow',
  'cursor',
  ...FLEX_PROPS,
  ...GRID_PROPS,
  ...SHARED_PROPS,
];

const PROP_LABELS = {
  display: 'Display',
  overflow: 'Overflow',
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
  showCursor = false
}) {
  const currentDisplay = typeof customStyle.display === 'string' ? customStyle.display : '';

  const isFlexDisplay = ['flex', 'inline-flex'].includes(currentDisplay);
  const isGridDisplay = ['grid', 'inline-grid'].includes(currentDisplay);

  const hasFlexOverrides = hasModifiedStyleProps(customStyle, FLEX_PROPS);
  const hasGridOverrides = hasModifiedStyleProps(customStyle, GRID_PROPS);

  const shouldShowFlexPanel = isFlexDisplay;
  const shouldShowGridPanel = isGridDisplay;

  const isDisplayModified = !!currentDisplay || isStylePropSet(customStyle, 'display');
  const isCursorModified = isStylePropSet(customStyle, 'cursor');
  const isModified =
    isDisplayModified ||
    isStylePropSet(customStyle, 'overflow') ||
    (showCursor && isCursorModified) ||
    hasFlexOverrides ||
    hasGridOverrides ||
    hasModifiedStyleProps(customStyle, SHARED_PROPS);

  const setProps = DISPLAY_PANEL_STYLE_KEYS.filter((key) => isStylePropSet(customStyle, key));

  const handleDisplayChange = (value) => {
    updateCustomStyle({ display: value || null });
  };

  const handleClearPanel = () => {
    const clearMap = DISPLAY_PANEL_STYLE_KEYS.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});
    updateCustomStyle(clearMap);
  };

  return (
    <PanelBody title={<PanelTitle title="Display & Layout" isModified={isModified} />} initialOpen={false}>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Display" isSet={isDisplayModified} />
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
        />
      )}

      {shouldShowGridPanel && (
        <GridControls
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          forceShow={hasGridOverrides}
          inline
        />
      )}

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Overflow" isSet={isStylePropSet(customStyle, 'overflow')} />
      </div>
      <SelectControl
        label="Overflow"
        hideLabelFromVision
        value={customStyle.overflow || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Visible', value: 'visible' },
          { label: 'Hidden', value: 'hidden' },
          { label: 'Scroll', value: 'scroll' },
          { label: 'Auto', value: 'auto' }
        ]}
        onChange={(val) => updateCustomStyle('overflow', val || null)}
      />

      {showCursor && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Cursor" isSet={isCursorModified} />
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

      {isModified && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {setProps.map((key) => (
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
                    backgroundColor: 'var(--wp-admin-theme-color, #007cba)',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                {PROP_LABELS[key] ?? key}
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
                  aria-label={`Unset ${PROP_LABELS[key] ?? key}`}
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
            Clear panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

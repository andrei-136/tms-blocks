// SpacingControls.js
import React, { useState, useEffect, useRef } from 'react';
import { PanelBody, SelectControl, ToggleControl, Button, Flex, FlexItem } from '@wordpress/components';
import UnitControls, { KEYWORDS_GLOBAL } from './UnitControls';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

const GROUP_STYLE = {
  padding: '8px',
  borderRadius: '4px',
  marginBottom: '4px',
};

const SECTION_LABEL_STYLE = {
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '8px',
};

const TOGGLE_STYLE = {
  fontSize: '11px',
  color: '#757575',
  marginBottom: '4px',
};

// padding: only global keywords
const PADDING_KEYWORDS = [...KEYWORDS_GLOBAL];

// margin: global keywords + auto (auto promoted to top-level, so not in keywords list)
const MARGIN_KEYWORDS = [...KEYWORDS_GLOBAL];

const SPACING_PROPS = [
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'boxSizing'
];

const PROP_LABELS = {
  paddingTop: 'Padding Top',
  paddingRight: 'Padding Right',
  paddingBottom: 'Padding Bottom',
  paddingLeft: 'Padding Left',
  marginTop: 'Margin Top',
  marginRight: 'Margin Right',
  marginBottom: 'Margin Bottom',
  marginLeft: 'Margin Left',
  boxSizing: 'Box Sizing',
};

function SpacingRow({ linked, onToggle, linkedLabel, prop, oppositeProp, customStyle, onChange, allowedUnits, keywords, unlinkedSides }) {
  const isSet = isStylePropSet(customStyle, prop) || (oppositeProp && isStylePropSet(customStyle, oppositeProp));

  const normalizeValue = (val) => {
    if (!val) return null;
    if (typeof val === 'string' && val === 'auto') return { value: 'auto', unit: 'auto' };
    return val;
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <Flex align="center" justify="space-between" style={TOGGLE_STYLE}>
        <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>
          <ControlLabel label={linkedLabel} isSet={isSet} />
        </span>
        <ToggleControl
          label=""
          checked={linked}
          onChange={onToggle}
          __nextHasNoMarginBottom
          style={{ marginBottom: 0 }}
        />
      </Flex>

      {linked ? (
        <UnitControls
          label={null}
          value={normalizeValue(customStyle[prop])}
          onChange={onChange}
          allowedUnits={allowedUnits}
          keywords={keywords}
        />
      ) : (
        unlinkedSides.map(({ label, sideProp }) => (
          <UnitControls
            key={sideProp}
            label={<ControlLabel label={label} isSet={isStylePropSet(customStyle, sideProp)} />}
            value={normalizeValue(customStyle[sideProp])}
            onChange={(val) => onChange(val, sideProp)}
            allowedUnits={allowedUnits}
            keywords={keywords}
          />
        ))
      )}
    </div>
  );
}

export default function SpacingControls({
  customStyle,
  updateCustomStyle,
  allowedUnits = ['px', 'rem', 'em', '%', 'vw', 'vh', 'custom', 'size-presets']
}) {
  // Helper to compare spacing values
  const areValuesEqual = (val1, val2) => {
    if (!val1 && !val2) return true;
    if (!val1 || !val2) return false;
    if (typeof val1 === 'string' && typeof val2 === 'string') return val1 === val2;
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return val1.value === val2.value && val1.unit === val2.unit;
    }
    return false;
  };

  // Initialize toggle states based on customStyle values
  const [linkVerticalMargins, setLinkVerticalMargins] = useState(() =>
    areValuesEqual(customStyle.marginTop, customStyle.marginBottom)
  );
  const [linkHorizontalMargins, setLinkHorizontalMargins] = useState(() =>
    areValuesEqual(customStyle.marginLeft, customStyle.marginRight)
  );
  const [linkVerticalPaddings, setLinkVerticalPaddings] = useState(() =>
    areValuesEqual(customStyle.paddingTop, customStyle.paddingBottom)
  );
  const [linkHorizontalPaddings, setLinkHorizontalPaddings] = useState(() =>
    areValuesEqual(customStyle.paddingLeft, customStyle.paddingRight)
  );

  // Track previous customStyle to detect block changes
  const prevCustomStyleRef = useRef(customStyle);

  // Re-initialize toggle states when block changes (detected by customStyle object reference)
  useEffect(() => {
    if (prevCustomStyleRef.current !== customStyle) {
      setLinkVerticalMargins(areValuesEqual(customStyle.marginTop, customStyle.marginBottom));
      setLinkHorizontalMargins(areValuesEqual(customStyle.marginLeft, customStyle.marginRight));
      setLinkVerticalPaddings(areValuesEqual(customStyle.paddingTop, customStyle.paddingBottom));
      setLinkHorizontalPaddings(areValuesEqual(customStyle.paddingLeft, customStyle.paddingRight));
      prevCustomStyleRef.current = customStyle;
    }
  }, [customStyle]);

  const paddingAllowedUnits = [...allowedUnits, 'keywords'];
  const marginAllowedUnits = [...allowedUnits, 'auto', 'keywords'];

  const normalizeValue = (val) => {
    if (!val) return null;
    if (typeof val === 'object' && val.value === '') return val;
    if (val?.unit === 'auto' && val?.value === 'auto') return 'auto';
    return val;
  };

  const pickLinkedValue = (a, b) => {
    const hasSideValue = (val) => {
      if (!val) return false;
      if (typeof val === 'string') return val !== '';
      if (typeof val === 'object') return val.value !== '' && val.value != null;
      return false;
    };
    return hasSideValue(a) ? a : hasSideValue(b) ? b : null;
  };

  // Padding handlers
  const handlePaddingChange = (val, prop) => {
    const normalized = normalizeValue(val);
    const opposite = { paddingTop: 'paddingBottom', paddingBottom: 'paddingTop', paddingLeft: 'paddingRight', paddingRight: 'paddingLeft' };
    const isLinked = (prop === 'paddingTop' || prop === 'paddingBottom') ? linkVerticalPaddings : linkHorizontalPaddings;
    updateCustomStyle({ [prop]: normalized, ...(isLinked && { [opposite[prop]]: normalized }) });
  };

  const handleLinkVerticalPaddings = (enabled) => {
    setLinkVerticalPaddings(enabled);
    if (enabled) {
      const v = pickLinkedValue(customStyle.paddingTop, customStyle.paddingBottom);
      updateCustomStyle({ paddingTop: v, paddingBottom: v });
    }
  };

  const handleLinkHorizontalPaddings = (enabled) => {
    setLinkHorizontalPaddings(enabled);
    if (enabled) {
      const v = pickLinkedValue(customStyle.paddingLeft, customStyle.paddingRight);
      updateCustomStyle({ paddingLeft: v, paddingRight: v });
    }
  };

  // Margin handlers
  const handleMarginChange = (val, prop) => {
    const normalized = normalizeValue(val);
    const opposite = { marginTop: 'marginBottom', marginBottom: 'marginTop', marginLeft: 'marginRight', marginRight: 'marginLeft' };
    const isLinked = (prop === 'marginTop' || prop === 'marginBottom') ? linkVerticalMargins : linkHorizontalMargins;
    updateCustomStyle({ [prop]: normalized, ...(isLinked && { [opposite[prop]]: normalized }) });
  };

  const handleLinkVerticalMargins = (enabled) => {
    setLinkVerticalMargins(enabled);
    if (enabled) {
      const v = pickLinkedValue(customStyle.marginTop, customStyle.marginBottom);
      updateCustomStyle({ marginTop: v, marginBottom: v });
    }
  };

  const handleLinkHorizontalMargins = (enabled) => {
    setLinkHorizontalMargins(enabled);
    if (enabled) {
      const v = pickLinkedValue(customStyle.marginLeft, customStyle.marginRight);
      updateCustomStyle({ marginLeft: v, marginRight: v });
    }
  };

  const isModified = hasModifiedStyleProps(customStyle, SPACING_PROPS);
  const setProps = SPACING_PROPS.filter((key) => isStylePropSet(customStyle, key));

  return (
    <PanelBody title={<PanelTitle title="Spacing" isModified={isModified} />} initialOpen={false}>

      {/* Padding */}
      <div style={{ ...GROUP_STYLE, background: 'hsl(251, 50%, 94%)' }}>
        <label style={SECTION_LABEL_STYLE}>Padding</label>

        <SpacingRow
          linked={linkVerticalPaddings}
          onToggle={handleLinkVerticalPaddings}
          linkedLabel="Top / Bottom"
          prop="paddingTop"
          oppositeProp="paddingBottom"
          customStyle={customStyle}
          onChange={(val, sideProp = 'paddingTop') => handlePaddingChange(val, sideProp)}
          allowedUnits={paddingAllowedUnits}
          keywords={PADDING_KEYWORDS}
          unlinkedSides={[
            { label: 'Top', sideProp: 'paddingTop' },
            { label: 'Bottom', sideProp: 'paddingBottom' },
          ]}
        />

        <SpacingRow
          linked={linkHorizontalPaddings}
          onToggle={handleLinkHorizontalPaddings}
          linkedLabel="Left / Right"
          prop="paddingLeft"
          oppositeProp="paddingRight"
          customStyle={customStyle}
          onChange={(val, sideProp = 'paddingLeft') => handlePaddingChange(val, sideProp)}
          allowedUnits={paddingAllowedUnits}
          keywords={PADDING_KEYWORDS}
          unlinkedSides={[
            { label: 'Left', sideProp: 'paddingLeft' },
            { label: 'Right', sideProp: 'paddingRight' },
          ]}
        />
      </div>

      {/* Margin */}
      <div style={{ ...GROUP_STYLE, background: 'hsl(251, 50%, 91%)' }}>
        <label style={SECTION_LABEL_STYLE}>Margin</label>

        <SpacingRow
          linked={linkVerticalMargins}
          onToggle={handleLinkVerticalMargins}
          linkedLabel="Top / Bottom"
          prop="marginTop"
          oppositeProp="marginBottom"
          customStyle={customStyle}
          onChange={(val, sideProp = 'marginTop') => handleMarginChange(val, sideProp)}
          allowedUnits={marginAllowedUnits}
          keywords={MARGIN_KEYWORDS}
          unlinkedSides={[
            { label: 'Top', sideProp: 'marginTop' },
            { label: 'Bottom', sideProp: 'marginBottom' },
          ]}
        />

        <SpacingRow
          linked={linkHorizontalMargins}
          onToggle={handleLinkHorizontalMargins}
          linkedLabel="Left / Right"
          prop="marginLeft"
          oppositeProp="marginRight"
          customStyle={customStyle}
          onChange={(val, sideProp = 'marginLeft') => handleMarginChange(val, sideProp)}
          allowedUnits={marginAllowedUnits}
          keywords={MARGIN_KEYWORDS}
          unlinkedSides={[
            { label: 'Left', sideProp: 'marginLeft' },
            { label: 'Right', sideProp: 'marginRight' },
          ]}
        />
      </div>

      {/* Box Sizing */}
      <div style={{ marginBottom: '8px', marginTop: '4px' }}>
        <ControlLabel label="Box Sizing" isSet={isStylePropSet(customStyle, 'boxSizing')} />
      </div>
      <SelectControl
        label="Box Sizing"
        hideLabelFromVision
        value={customStyle.boxSizing || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Content Box', value: 'content-box' },
          { label: 'Border Box', value: 'border-box' }
        ]}
        onChange={(val) => updateCustomStyle('boxSizing', val || null)}
      />

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
            onClick={() => updateCustomStyle({
              paddingTop: null, paddingRight: null, paddingBottom: null, paddingLeft: null,
              marginTop: null, marginRight: null, marginBottom: null, marginLeft: null,
              boxSizing: null,
            })}
          >
            Clear panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

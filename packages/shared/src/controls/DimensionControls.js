import React from 'react';
import { PanelBody, TextControl, Button } from '@wordpress/components';
import UnitControls, { KEYWORDS_SIZING, KEYWORDS_GLOBAL } from './UnitControls';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

const DIMENSION_UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh', 'auto', 'keywords', 'custom', 'size-presets'];
const DIMENSION_UNITS_NO_AUTO = ['px', 'rem', 'em', '%', 'vw', 'vh', 'keywords', 'custom', 'size-presets'];
const WIDTH_UNITS = [...DIMENSION_UNITS, 'layout-presets'];
const WIDTH_UNITS_NO_AUTO = [...DIMENSION_UNITS_NO_AUTO, 'layout-presets'];

const WIDTH_HEIGHT_KEYWORDS = [...KEYWORDS_SIZING, ...KEYWORDS_GLOBAL];
const MIN_WIDTH_HEIGHT_KEYWORDS = [
  ...KEYWORDS_SIZING.filter((k) => k.value !== 'content'),
  ...KEYWORDS_GLOBAL,
];
const MAX_WIDTH_HEIGHT_KEYWORDS = [
  ...KEYWORDS_SIZING.filter((k) => k.value !== 'auto' && k.value !== 'content'),
  ...KEYWORDS_GLOBAL,
];

const getAllowedUnitsForKey = (key) => {
  if (key === 'maxWidth') return WIDTH_UNITS_NO_AUTO;
  if (key === 'maxHeight') return DIMENSION_UNITS_NO_AUTO;
  if (key.toLowerCase().includes('width')) return WIDTH_UNITS;
  return DIMENSION_UNITS;
};

const DIMENSION_PAIRS = [
  { keys: ['width', 'height'], labels: ['Width', 'Height'] },
  { keys: ['minWidth', 'maxWidth'], labels: ['Min Width', 'Max Width'] },
  { keys: ['minHeight', 'maxHeight'], labels: ['Min Height', 'Max Height'] },
];

const getKeywordsForKey = (key) => {
  if (key === 'maxWidth' || key === 'maxHeight') return MAX_WIDTH_HEIGHT_KEYWORDS;
  if (key === 'minWidth' || key === 'minHeight') return MIN_WIDTH_HEIGHT_KEYWORDS;
  return WIDTH_HEIGHT_KEYWORDS;
};

const DIMENSION_PROPS = [
  'width', 'height',
  'minWidth', 'maxWidth',
  'minHeight', 'maxHeight',
  'aspectRatio',
];

const PROP_LABELS = {
  width: 'Width',
  height: 'Height',
  minWidth: 'Min Width',
  maxWidth: 'Max Width',
  minHeight: 'Min Height',
  maxHeight: 'Max Height',
  aspectRatio: 'Aspect Ratio',
};

export default function DimensionControls({ customStyle, updateCustomStyle }) {
  const isModified = hasModifiedStyleProps(customStyle, DIMENSION_PROPS);
  const setProps = DIMENSION_PROPS.filter((key) => isStylePropSet(customStyle, key));

  return (
    <PanelBody title={<PanelTitle title="Size" isModified={isModified} />} initialOpen={false}>
      {DIMENSION_PAIRS.map(({ keys, labels }) => (
        <div
          key={keys[0]}
          style={{
            borderRadius: '4px',
            padding: '8px',
            marginBottom: '4px',
          }}
        >
          {keys.map((key, j) => (
            <UnitControls
              key={key}
              label={<ControlLabel label={labels[j]} isSet={isStylePropSet(customStyle, key)} />}
              value={customStyle[key]}
              onChange={(val) => updateCustomStyle(key, val.value, val.unit)}
              allowedUnits={getAllowedUnitsForKey(key)}
              keywords={getKeywordsForKey(key)}
            />
          ))}
        </div>
      ))}

      <div style={{ marginBottom: '8px', marginTop: '8px' }}>
        <ControlLabel label="Aspect Ratio" isSet={isStylePropSet(customStyle, 'aspectRatio')} />
      </div>
      <TextControl
        label="Aspect Ratio"
        hideLabelFromVision
        value={customStyle.aspectRatio || ''}
        placeholder="e.g. 16/9 or 1.777"
        onChange={(val) => updateCustomStyle('aspectRatio', val || null)}
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
              width: null, height: null,
              minWidth: null, minHeight: null,
              maxWidth: null, maxHeight: null,
              aspectRatio: null,
            })}
          >
            Clear panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

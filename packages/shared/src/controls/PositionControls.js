import React from 'react';
import { PanelBody, SelectControl, TextControl, Button } from '@wordpress/components';
import UnitControls, { KEYWORDS_GLOBAL } from './UnitControls';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

const POSITION_PROPS = ['position', 'top', 'right', 'bottom', 'left', 'zIndex'];

const PROP_LABELS = {
  position: 'Position',
  top: 'Top',
  right: 'Right',
  bottom: 'Bottom',
  left: 'Left',
  zIndex: 'Z Index',
};

const OFFSET_UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh', 'auto', 'keywords', 'custom'];

export default function PositionControls({ customStyle, updateCustomStyle }) {
  const isModified = hasModifiedStyleProps(customStyle, POSITION_PROPS);
  const setProps = POSITION_PROPS.filter((key) => isStylePropSet(customStyle, key));

  return (
    <PanelBody title={<PanelTitle title="Position" isModified={isModified} />} initialOpen={false}>
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Position" isSet={isStylePropSet(customStyle, 'position')} />
      </div>
      <SelectControl
        label="Position"
        hideLabelFromVision
        value={customStyle.position || ''}
        options={[
          { label: 'Default', value: '' },
          { label: 'Static', value: 'static' },
          { label: 'Relative', value: 'relative' },
          { label: 'Absolute', value: 'absolute' },
          { label: 'Fixed', value: 'fixed' },
          { label: 'Sticky', value: 'sticky' }
        ]}
        onChange={(val) => updateCustomStyle('position', val)}
      />

      {customStyle.position && customStyle.position !== '' && customStyle.position !== 'static' && (
        <>
          <UnitControls
            label={<ControlLabel label="Top" isSet={isStylePropSet(customStyle, 'top')} />}
            value={customStyle.top}
            onChange={(val) => updateCustomStyle('top', val.value, val.unit)}
            allowedUnits={OFFSET_UNITS}
            keywords={KEYWORDS_GLOBAL}
            min={-500}
            max={500}
          />
          <UnitControls
            label={<ControlLabel label="Right" isSet={isStylePropSet(customStyle, 'right')} />}
            value={customStyle.right}
            onChange={(val) => updateCustomStyle('right', val.value, val.unit)}
            allowedUnits={OFFSET_UNITS}
            keywords={KEYWORDS_GLOBAL}
            min={-500}
            max={500}
          />
          <UnitControls
            label={<ControlLabel label="Bottom" isSet={isStylePropSet(customStyle, 'bottom')} />}
            value={customStyle.bottom}
            onChange={(val) => updateCustomStyle('bottom', val.value, val.unit)}
            allowedUnits={OFFSET_UNITS}
            keywords={KEYWORDS_GLOBAL}
            min={-500}
            max={500}
          />
          <UnitControls
            label={<ControlLabel label="Left" isSet={isStylePropSet(customStyle, 'left')} />}
            value={customStyle.left}
            onChange={(val) => updateCustomStyle('left', val.value, val.unit)}
            allowedUnits={OFFSET_UNITS}
            keywords={KEYWORDS_GLOBAL}
            min={-500}
            max={500}
          />

          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Z Index" isSet={isStylePropSet(customStyle, 'zIndex')} />
          </div>
          <TextControl
            label="Z Index"
            hideLabelFromVision
            type="number"
            value={customStyle.zIndex || ''}
            onChange={(val) => updateCustomStyle('zIndex', val || null)}
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
            onClick={() => updateCustomStyle({
              position: null,
              top: null,
              right: null,
              bottom: null,
              left: null,
              zIndex: null,
            })}
          >
            Clear panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

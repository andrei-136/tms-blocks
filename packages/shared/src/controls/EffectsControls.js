/**
 * EFFECTS CONTROLS
 *
 * Box Shadow, Drop Shadow, Transform, Backdrop Filter, Mix Blend Mode, Opacity
 */

import React, { useState, useEffect } from 'react';
import {
  PanelBody,
  RangeControl,
  ToggleControl,
  SelectControl,
  Button,
  Flex,
} from '@wordpress/components';
import UnitControls from './UnitControls';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';
import ColorControls from './ColorControls';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SHADOW_UNITS = ['px', 'rem', 'em', 'custom'];
const TRANSFORM_LENGTH_UNITS = ['px', '%', 'rem', 'em', 'vw', 'vh', 'custom'];
const TRANSFORM_ANGLE_UNITS = ['deg', 'rad', 'turn', 'custom'];
const TRANSFORM_SCALE_UNITS = ['unitless', 'custom'];

const MIX_BLEND_MODE_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Normal', value: 'normal' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
  { label: 'Hue', value: 'hue' },
  { label: 'Saturation', value: 'saturation' },
  { label: 'Color', value: 'color' },
  { label: 'Luminosity', value: 'luminosity' },
];

const GROUP_STYLE = {
  background: 'hsl(251, 50%, 94%)',
  borderRadius: '4px',
  padding: '8px 4px',
  marginBottom: '8px',
};

const SECTION_LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#1e1e1e',
  display: 'block',
  marginBottom: '8px',
};

const SUBSECTION_DIVIDER = {
  margin: '12px 0',
  border: 'none',
  borderTop: '1px solid rgba(0,0,0,0.1)',
};

const FILTER_SUBSECTION_STYLE = {
  background: 'rgba(255,255,255,0.45)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '4px',
  padding: '8px 4px',
};

const GRID_2X2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '2px',
  marginTop: '8px',
};

// â”€â”€â”€ Assemblers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const hasConfigValue = (val) => val?.value !== undefined && val?.value !== null && val?.value !== '';

const hasCompositeParts = (parts = {}) =>
  Object.values(parts).some((part) => {
    if (part === null || part === undefined || part === '' || part === false) return false;
    if (typeof part === 'object') return Object.keys(part).length > 0;
    return true;
  });

const buildComposedStyleValue = (css, parts = {}) => {
  if (!css && !hasCompositeParts(parts)) return null;
  return { value: css || '', unit: 'custom', ...parts };
};

const formatUnit = (val, fallback = '0') => {
  if (!hasConfigValue(val)) return fallback;
  if (val.unit === 'custom' || val.unit === 'unitless' || val.unit === 'keyword') return String(val.value);
  return `${val.value}${val.unit || 'px'}`;
};

const assembleBoxShadow = (parts) => {
  const { offsetX, offsetY, blur, spread, color, inset } = parts;
  const hasNumericPart = !!offsetX?.value || !!offsetY?.value || !!blur?.value || !!spread?.value;
  const hasNonNumericPart = !!color || !!inset;
  if (!hasNumericPart && !hasNonNumericPart) return null;
  const insetStr = inset ? 'inset ' : '';
  return `${insetStr}${formatUnit(offsetX)} ${formatUnit(offsetY)} ${formatUnit(blur)} ${formatUnit(spread)} ${color || 'rgba(0,0,0,0.3)'}`;
};

// assembleFilter supports multiple filter functions - add more here later
const assembleFilter = ({ blur, dropShadow } = {}) => {
  const chunks = [];
  if (blur?.value) {
    chunks.push(`blur(${formatUnit(blur)})`);
  }
  if (dropShadow) {
    const { offsetX, offsetY, blur: dsBlur, color } = dropShadow;
    if (offsetX?.value || offsetY?.value || dsBlur?.value) {
      chunks.push(`drop-shadow(${formatUnit(offsetX)} ${formatUnit(offsetY)} ${formatUnit(dsBlur)} ${color || 'rgba(0,0,0,0.3)'})`);
    }
  }
  return chunks.length ? chunks.join(' ') : null;
};

const assembleBackdropFilter = ({ blur } = {}) => {
  const chunks = [];
  if (blur?.value) {
    chunks.push(`blur(${formatUnit(blur)})`);
  }
  return chunks.length ? chunks.join(' ') : null;
};

const assembleTransform = ({ translateX, translateY, rotate, scaleX, scaleY, skewX, skewY } = {}) => {
  const chunks = [];

  if (hasConfigValue(translateX)) chunks.push(`translateX(${formatUnit(translateX)})`);
  if (hasConfigValue(translateY)) chunks.push(`translateY(${formatUnit(translateY)})`);
  if (hasConfigValue(rotate)) chunks.push(`rotate(${formatUnit(rotate)})`);
  if (hasConfigValue(scaleX)) chunks.push(`scaleX(${formatUnit(scaleX, '1')})`);
  if (hasConfigValue(scaleY)) chunks.push(`scaleY(${formatUnit(scaleY, '1')})`);
  if (hasConfigValue(skewX)) chunks.push(`skewX(${formatUnit(skewX)})`);
  if (hasConfigValue(skewY)) chunks.push(`skewY(${formatUnit(skewY)})`);

  return chunks.length ? chunks.join(' ') : null;
};

// --- Shadow 2x2 grid ---------------------------------------------------------

function ShadowGrid({ offsetX, offsetY, blur, spread, onOffsetX, onOffsetY, onBlur, onSpread, showSpread = true }) {
  return (
    <div style={GRID_2X2}>
      <UnitControls
        label={<ControlLabel label="Offset X" isSet={!!offsetX?.value} />}
        value={offsetX}
        onChange={onOffsetX}
        allowedUnits={SHADOW_UNITS}
      />
      <UnitControls
        label={<ControlLabel label="Offset Y" isSet={!!offsetY?.value} />}
        value={offsetY}
        onChange={onOffsetY}
        allowedUnits={SHADOW_UNITS}
      />
      <UnitControls
        label={<ControlLabel label="Blur" isSet={!!blur?.value} />}
        value={blur}
        onChange={onBlur}
        allowedUnits={SHADOW_UNITS}
      />
      {showSpread && (
        <UnitControls
          label={<ControlLabel label="Spread" isSet={!!spread?.value} />}
          value={spread}
          onChange={onSpread}
          allowedUnits={SHADOW_UNITS}
        />
      )}
    </div>
  );
}

// --- Main component ----------------------------------------------------------

export default function EffectsControls({ customStyle = {}, updateCustomStyle }) {
  const boxShadow = customStyle.boxShadow || {};
  const filter = customStyle.filter || {};
  const transform = customStyle.transform || {};
  const backdropFilter = customStyle.backdropFilter || {};
  const filterBlur = filter.blur || null;
  const backdropBlur = backdropFilter.blur || null;
  const { mixBlendMode, opacity } = customStyle;

  const hasDropShadowValue =
    hasConfigValue(filter.dropShadow?.offsetX) ||
    hasConfigValue(filter.dropShadow?.offsetY) ||
    hasConfigValue(filter.dropShadow?.blur) ||
    !!filter.dropShadow?.color;

  const hasTransformValue = [
    transform.translateX,
    transform.translateY,
    transform.rotate,
    transform.scaleX,
    transform.scaleY,
    transform.skewX,
    transform.skewY,
  ].some(hasConfigValue);

  const hasOpacityValue = opacity !== null && opacity !== undefined && opacity !== '';
  const [customOpacity, setCustomOpacity] = useState(hasOpacityValue);

  useEffect(() => {
    setCustomOpacity(hasOpacityValue);
  }, [hasOpacityValue]);

  const isModified = hasModifiedStyleProps(customStyle, [
    'boxShadow', 'filter', 'transform', 'backdropFilter', 'mixBlendMode', 'opacity',
  ]);

  const getOpacityValue = () => {
    if (!hasOpacityValue) return 1;
    if (typeof opacity === 'object' && opacity.value !== undefined) return parseFloat(opacity.value);
    return parseFloat(opacity);
  };

  // --- Box shadow ------------------------------------------------------------

  const updateBoxShadow = (patch) => {
    const { value: _v, unit: _u, ...prevParts } = boxShadow;
    const parts = { ...prevParts, ...patch };
    const css = assembleBoxShadow(parts);
    updateCustomStyle('boxShadow', buildComposedStyleValue(css, parts));
  };

  // --- Drop shadow -----------------------------------------------------------

  const updateDropShadow = (patch) => {
    const { value: _v, unit: _u, dropShadow: prevDropShadow = {}, blur = filterBlur } = filter;
    const dropShadow = { ...prevDropShadow, ...patch };
    const filterParts = { dropShadow, ...(blur ? { blur } : {}) };
    const css = assembleFilter(filterParts);
    updateCustomStyle('filter', buildComposedStyleValue(css, filterParts));
  };

  // --- Filter blur -----------------------------------------------------------

  const updateFilterBlur = (val) => {
    const { value: _v, unit: _u, dropShadow = filter.dropShadow } = filter;
    const blur = val && typeof val === 'object'
      ? { value: val.value, unit: val.unit }
      : null;
    const filterParts = { ...(dropShadow ? { dropShadow } : {}), ...(blur ? { blur } : {}) };
    const css = assembleFilter(filterParts);
    updateCustomStyle('filter', buildComposedStyleValue(css, filterParts));
  };

  // --- Backdrop blur ---------------------------------------------------------

  const updateBackdropBlur = (val) => {
    const { value: _v, unit: _u, ...prevParts } = backdropFilter;
    const blur = val && typeof val === 'object'
      ? { value: val.value, unit: val.unit }
      : null;
    const parts = { ...prevParts, ...(blur ? { blur } : {}) };
    const css = assembleBackdropFilter(parts);
    updateCustomStyle('backdropFilter', buildComposedStyleValue(css, parts));
  };

  // --- Transform -------------------------------------------------------------

  const updateTransform = (patch) => {
    const { value: _v, unit: _u, ...prevParts } = transform;
    const parts = { ...prevParts, ...patch };
    const css = assembleTransform(parts);
    updateCustomStyle('transform', buildComposedStyleValue(css, parts));
  };

  // --- Render ----------------------------------------------------------------

  return (
    <PanelBody title={<PanelTitle title="Effects" isModified={isModified} />} initialOpen={false}>

      {/* Box Shadow */}
      <div style={GROUP_STYLE}>
        <Flex align="center" justify="space-between">
          <ControlLabel label="Box Shadow" isSet={isStylePropSet(customStyle, 'boxShadow')} />
          {(boxShadow.offsetX?.value || boxShadow.offsetY?.value || boxShadow.blur?.value || boxShadow.spread?.value) && (
            <Button isSmall isDestructive variant="tertiary" onClick={() => updateCustomStyle('boxShadow', null)}>
              Clear
            </Button>
          )}
        </Flex>
        <ShadowGrid
          offsetX={boxShadow.offsetX} offsetY={boxShadow.offsetY}
          blur={boxShadow.blur} spread={boxShadow.spread}
          onOffsetX={(val) => updateBoxShadow({ offsetX: val })}
          onOffsetY={(val) => updateBoxShadow({ offsetY: val })}
          onBlur={(val) => updateBoxShadow({ blur: val })}
          onSpread={(val) => updateBoxShadow({ spread: val })}
        />
        <div style={{ marginTop: '8px' }}>
          <ColorControls
            customStyle={{ shadowColor: boxShadow.color }}
            updateCustomStyle={(prop, val) => updateBoxShadow({ color: val })}
            property="shadowColor"
            label="Shadow Color"
            variant="button"
            usePanelBody={false}
          />
        </div>
        <div style={{ marginTop: '4px' }}>
          <ToggleControl
            label={<ControlLabel label="Inset" isSet={!!boxShadow.inset} />}
            checked={boxShadow.inset || false}
            onChange={(val) => updateBoxShadow({ inset: val || null })}
            __nextHasNoMarginBottom
          />
        </div>
      </div>

      {/* Filters group */}
      <div style={{ ...GROUP_STYLE, background: 'hsl(251, 50%, 91%)' }}>
        <label style={SECTION_LABEL_STYLE}>Filters</label>

        {/* Drop Shadow */}
        <div style={FILTER_SUBSECTION_STYLE}>
          <Flex align="center" justify="space-between">
            <ControlLabel label="Drop Shadow" isSet={hasDropShadowValue} />
            {hasDropShadowValue && (
              <Button isSmall isDestructive variant="tertiary" onClick={() => {
                const css = assembleFilter({ blur: filterBlur });
                updateCustomStyle('filter', css ? { value: css, unit: 'custom', ...(filterBlur ? { blur: filterBlur } : {}) } : null);
              }}>
                Clear
              </Button>
            )}
          </Flex>

          {/* 2x2 grid + color as 4th cell */}
          <div style={GRID_2X2}>
            <UnitControls
              label={<ControlLabel label="Offset X" isSet={!!filter.dropShadow?.offsetX?.value} />}
              value={filter.dropShadow?.offsetX}
              onChange={(val) => updateDropShadow({ offsetX: val })}
              allowedUnits={SHADOW_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Offset Y" isSet={!!filter.dropShadow?.offsetY?.value} />}
              value={filter.dropShadow?.offsetY}
              onChange={(val) => updateDropShadow({ offsetY: val })}
              allowedUnits={SHADOW_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Blur" isSet={!!filter.dropShadow?.blur?.value} />}
              value={filter.dropShadow?.blur}
              onChange={(val) => updateDropShadow({ blur: val })}
              allowedUnits={SHADOW_UNITS}
            />
            <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1e1e1e', marginBottom: '2px' }}>
                <ControlLabel label="Color" isSet={!!filter.dropShadow?.color} />
              </div>
              <ColorControls
                customStyle={{ dropShadowColor: filter.dropShadow?.color }}
                updateCustomStyle={(prop, val) => updateDropShadow({ color: val })}
                property="dropShadowColor"
                label={null}
                variant="button"
                usePanelBody={false}
                showToggleMarker={false}
              />
            </div>
          </div>
        </div>

        <hr style={SUBSECTION_DIVIDER} />

        {/* Filter Blur */}
        <div style={FILTER_SUBSECTION_STYLE}>
          <Flex align="center" justify="space-between">
            <ControlLabel label="Blur" isSet={!!filterBlur?.value} />
            {filterBlur?.value && (
              <Button isSmall isDestructive variant="tertiary" onClick={() => {
                const css = assembleFilter({ dropShadow: filter.dropShadow });
                updateCustomStyle('filter', css ? { value: css, unit: 'custom', ...(filter.dropShadow ? { dropShadow: filter.dropShadow } : {}) } : null);
              }}>
                Clear
              </Button>
            )}
          </Flex>
          <div style={{ marginTop: '8px' }}>
            <UnitControls
              label={null}
              value={filterBlur}
              onChange={updateFilterBlur}
              allowedUnits={['px', 'rem', 'em', 'custom']}
            />
          </div>
        </div>
      </div>

      {/* Transform group */}
      <div style={{ ...GROUP_STYLE, background: 'hsl(251, 50%, 90%)' }}>
        <Flex align="center" justify="space-between">
          <label style={SECTION_LABEL_STYLE}>Transform</label>
          {hasTransformValue && (
            <Button isSmall isDestructive variant="tertiary" onClick={() => updateCustomStyle('transform', null)}>
              Clear
            </Button>
          )}
        </Flex>

        <div style={FILTER_SUBSECTION_STYLE}>
          <div style={GRID_2X2}>
            <UnitControls
              label={<ControlLabel label="Translate X" isSet={hasConfigValue(transform.translateX)} />}
              value={transform.translateX}
              onChange={(val) => updateTransform({ translateX: val })}
              allowedUnits={TRANSFORM_LENGTH_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Translate Y" isSet={hasConfigValue(transform.translateY)} />}
              value={transform.translateY}
              onChange={(val) => updateTransform({ translateY: val })}
              allowedUnits={TRANSFORM_LENGTH_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Rotate" isSet={hasConfigValue(transform.rotate)} />}
              value={transform.rotate}
              onChange={(val) => updateTransform({ rotate: val })}
              allowedUnits={TRANSFORM_ANGLE_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Scale X" isSet={hasConfigValue(transform.scaleX)} />}
              value={transform.scaleX}
              onChange={(val) => updateTransform({ scaleX: val })}
              allowedUnits={TRANSFORM_SCALE_UNITS}
            />
          </div>

          <div style={GRID_2X2}>
            <UnitControls
              label={<ControlLabel label="Scale Y" isSet={hasConfigValue(transform.scaleY)} />}
              value={transform.scaleY}
              onChange={(val) => updateTransform({ scaleY: val })}
              allowedUnits={TRANSFORM_SCALE_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Skew X" isSet={hasConfigValue(transform.skewX)} />}
              value={transform.skewX}
              onChange={(val) => updateTransform({ skewX: val })}
              allowedUnits={TRANSFORM_ANGLE_UNITS}
            />
            <UnitControls
              label={<ControlLabel label="Skew Y" isSet={hasConfigValue(transform.skewY)} />}
              value={transform.skewY}
              onChange={(val) => updateTransform({ skewY: val })}
              allowedUnits={TRANSFORM_ANGLE_UNITS}
            />
          </div>
        </div>
      </div>

      {/* Backdrop Filters group */}
      <div style={{ ...GROUP_STYLE, background: 'hsl(251, 50%, 88%)' }}>
        <label style={SECTION_LABEL_STYLE}>Backdrop Filters</label>

        <div style={FILTER_SUBSECTION_STYLE}>
          <Flex align="center" justify="space-between">
            <ControlLabel label="Blur" isSet={!!backdropBlur?.value} />
            {backdropBlur?.value && (
              <Button isSmall isDestructive variant="tertiary" onClick={() => updateCustomStyle('backdropFilter', null)}>
                Clear
              </Button>
            )}
          </Flex>
          <div style={{ marginTop: '8px' }}>
            <UnitControls
              label={null}
              value={backdropBlur}
              onChange={updateBackdropBlur}
              allowedUnits={['px', 'rem', 'em', 'custom']}
            />
          </div>
        </div>
      </div>

      {/* Mix Blend Mode */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Mix Blend Mode" isSet={isStylePropSet(customStyle, 'mixBlendMode')} />
      </div>
      <SelectControl
        label="Mix Blend Mode"
        hideLabelFromVision
        value={mixBlendMode || ''}
        options={MIX_BLEND_MODE_OPTIONS}
        onChange={(val) => updateCustomStyle('mixBlendMode', val || null)}
        __nextHasNoMarginBottom
      />

      <hr style={{ margin: '12px 0', borderTop: '1px solid #ddd' }} />

      {/* Opacity */}
      <ToggleControl
        label={<ControlLabel label="Custom Opacity" isSet={isStylePropSet(customStyle, 'opacity')} />}
        checked={customOpacity}
        onChange={(enabled) => {
          setCustomOpacity(enabled);
          updateCustomStyle('opacity', enabled ? 1 : null);
        }}
        __nextHasNoMarginBottom
      />
      {customOpacity && (
        <RangeControl
          label={<ControlLabel label="Opacity" isSet={isStylePropSet(customStyle, 'opacity')} />}
          value={getOpacityValue()}
          onChange={(val) => updateCustomStyle('opacity', val, 'unitless')}
          min={0}
          max={1}
          step={0.01}
          __nextHasNoMarginBottom
        />
      )}

      {isModified && (
        <Button
          variant="secondary"
          isDestructive
          onClick={() => {
            setCustomOpacity(false);
            updateCustomStyle({
              boxShadow: null,
              filter: null,
              transform: null,
              backdropFilter: null,
              mixBlendMode: null,
              opacity: null,
            });
          }}
          style={{ marginTop: '8px' }}
        >
          Clear panel properties
        </Button>
      )}
    </PanelBody>
  );
}

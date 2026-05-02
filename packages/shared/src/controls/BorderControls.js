/**
 * BORDER CONTROLS
 *
 * Each border side has its own row: width + style + color button (opens modal).
 * Unified mode collapses all four sides into one row.
 * Radius section remains separate.
 */

import React, { useState, useEffect } from 'react';
import {
  PanelBody,
  ToggleControl,
  SelectControl,
  Button,
  Dropdown,
  Flex,
  FlexItem,
} from '@wordpress/components';
import UnitControls, { KEYWORDS_GLOBAL } from './UnitControls';
import ColorControls from './ColorControls';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STYLE_OPTIONS = [
  { label: '- Style -', value: '' },
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'Double', value: 'double' },
  { label: 'Groove', value: 'groove' },
  { label: 'Ridge', value: 'ridge' },
  { label: 'Inset', value: 'inset' },
  { label: 'Outset', value: 'outset' },
];

const WIDTH_UNITS = ['px', 'rem', 'em', 'custom', 'keywords'];
const RADIUS_UNITS = ['px', 'rem', 'em', '%', 'custom', 'keywords'];

const SIDES = [
  { label: 'Top',    widthProp: 'borderTopWidth',    styleProp: 'borderTopStyle',    colorProp: 'borderTopColor' },
  { label: 'Right',  widthProp: 'borderRightWidth',  styleProp: 'borderRightStyle',  colorProp: 'borderRightColor' },
  { label: 'Bottom', widthProp: 'borderBottomWidth', styleProp: 'borderBottomStyle', colorProp: 'borderBottomColor' },
  { label: 'Left',   widthProp: 'borderLeftWidth',   styleProp: 'borderLeftStyle',   colorProp: 'borderLeftColor' },
];

const CORNERS = [
  { label: 'Top Left',     prop: 'borderTopLeftRadius' },
  { label: 'Top Right',    prop: 'borderTopRightRadius' },
  { label: 'Bottom Left',  prop: 'borderBottomLeftRadius' },
  { label: 'Bottom Right', prop: 'borderBottomRightRadius' },
];

// â”€â”€â”€ Color swatch button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ColorButton({ color, label, onClick }) {
  return (
    <Button
      isSmall
      onClick={onClick}
      style={{ padding: '2px' }}
      aria-label={`Edit ${label}`}
      title={`Edit ${label}`}
    >
      <span
        style={{
          display: 'inline-block',
          width: '22px',
          height: '22px',
          borderRadius: '3px',
          background: color || 'transparent',
          border: '1px solid #949494',
          verticalAlign: 'middle',
        }}
      />
    </Button>
  );
}

// â”€â”€â”€ Single border side row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BorderSideRow({ label, widthProp, styleProp, colorProp, customStyle, updateCustomStyle, customBorderStyle }) {
  const handleWidthChange = (val) => {
    const isEmpty = val.value === '' || val.value === null || val.value === undefined;
    const isSpecialUnit = val.unit === 'custom' || val.unit === 'size-presets' || val.unit === 'font-size-presets';
    updateCustomStyle({
      [widthProp]: isEmpty && !isSpecialUnit ? null : { value: val.value, unit: val.unit },
    });
  };

  return (
    <div style={{ marginBottom: '4px' }}>
      {/* Label row: side name | style select | color swatch */}
      <Flex align="center" justify="space-between" style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e', minWidth: '44px' }}>
          <ControlLabel
            label={label}
            isSet={
              isStylePropSet(customStyle, widthProp) ||
              isStylePropSet(customStyle, styleProp) ||
              isStylePropSet(customStyle, colorProp)
            }
          />
        </span>

        {customBorderStyle && (
          <FlexItem style={{ flex: 1, margin: '0 6px' }}>
            <SelectControl
              value={customStyle[styleProp] || ''}
              options={STYLE_OPTIONS}
              onChange={(val) => updateCustomStyle({ [styleProp]: val || null })}
              __nextHasNoMarginBottom
            />
          </FlexItem>
        )}

        <Dropdown
          renderToggle={({ onToggle }) => (
            <Flex align="center" style={{ gap: '6px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1e1e1e' }}>
                <ControlLabel label="Color" isSet={isStylePropSet(customStyle, colorProp)} />
              </span>
              <ColorButton
                color={customStyle[colorProp]}
                label={`${label} border color`}
                onClick={onToggle}
              />
              {isStylePropSet(customStyle, colorProp) && (
                <Button
                  isSmall
                  variant="tertiary"
                  onClick={() => updateCustomStyle({ [colorProp]: null })}
                  style={{ border: '1px solid currentColor', padding: '2px 6px', lineHeight: 1 }}
                  aria-label={`Clear ${label} border color`}
                  title={`Clear ${label} border color`}
                >
                  ×
                </Button>
              )}
            </Flex>
          )}
          renderContent={({ onClose }) => (
            <div style={{ width: '320px' }}>
              <Flex justify="flex-end" style={{ marginBottom: '4px' }}>
                <Button
                  isSmall
                  variant="tertiary"
                  onClick={onClose}
                  aria-label="Close color picker"
                >
                  ×
                </Button>
              </Flex>
              <ColorControls
                customStyle={customStyle}
                updateCustomStyle={updateCustomStyle}
                property={colorProp}
                label={`${label} Border Color`}
                usePanelBody={false}
              />
            </div>
          )}
          placement="left-start"
          contentClassName="border-color-popover"
        />
      </Flex>

      {/* Width */}
      <UnitControls
        label={null}
        value={customStyle[widthProp]}
        onChange={handleWidthChange}
        allowedUnits={WIDTH_UNITS}
        keywords={KEYWORDS_GLOBAL}
      />
    </div>
  );
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BorderControls({ customStyle = {}, updateCustomStyle }) {
  const {
    borderWidth, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth,
    borderStyle, borderTopStyle, borderRightStyle, borderBottomStyle, borderLeftStyle,
    borderColor,
    borderRadius, borderTopLeftRadius, borderTopRightRadius, borderBottomLeftRadius, borderBottomRightRadius,
  } = customStyle;

  const [useIndividualSides, setUseIndividualSides] = useState(
    !!(borderTopWidth || borderRightWidth || borderBottomWidth || borderLeftWidth)
  );
  const [customBorderStyle, setCustomBorderStyle] = useState(
    !!(borderStyle && borderStyle !== 'solid') ||
    !!(borderTopStyle || borderRightStyle || borderBottomStyle || borderLeftStyle)
  );
  const [useIndividualRadius, setUseIndividualRadius] = useState(
    !!(borderTopLeftRadius || borderTopRightRadius || borderBottomLeftRadius || borderBottomRightRadius)
  );

  const isModified = hasModifiedStyleProps(customStyle, [
    'borderWidth',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRadius',
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomLeftRadius',
    'borderBottomRightRadius'
  ]);

  // â”€â”€ Auto border-style effect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (customBorderStyle) return;
    const hasValue = (v) => v?.value && v.value !== '';

    if (!useIndividualSides) {
      const has = hasValue(borderWidth);
      if (has && !borderStyle) updateCustomStyle({ borderStyle: 'solid' });
      else if (!has && borderStyle) updateCustomStyle({ borderStyle: null });
    } else {
      updateCustomStyle({
        borderStyle:       null,
        borderTopStyle:    hasValue(borderTopWidth)    ? 'solid' : null,
        borderRightStyle:  hasValue(borderRightWidth)  ? 'solid' : null,
        borderBottomStyle: hasValue(borderBottomWidth) ? 'solid' : null,
        borderLeftStyle:   hasValue(borderLeftWidth)   ? 'solid' : null,
      });
    }
  }, [borderWidth, borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth, useIndividualSides]);

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSidesToggle = (enabled) => {
    setUseIndividualSides(enabled);
    if (enabled) {
      updateCustomStyle({
        ...(borderWidth ? {
          borderTopWidth: borderWidth, borderRightWidth: borderWidth,
          borderBottomWidth: borderWidth, borderLeftWidth: borderWidth,
          borderWidth: null,
        } : {}),
        ...(customBorderStyle && borderStyle ? {
          borderTopStyle: borderStyle, borderRightStyle: borderStyle,
          borderBottomStyle: borderStyle, borderLeftStyle: borderStyle,
          borderStyle: null,
        } : !customBorderStyle ? { borderStyle: null } : {}),
      });
    } else {
      updateCustomStyle({
        borderWidth: borderTopWidth || null,
        borderTopWidth: null, borderRightWidth: null, borderBottomWidth: null, borderLeftWidth: null,
        ...(customBorderStyle ? {
          borderStyle: borderTopStyle || null,
          borderTopStyle: null, borderRightStyle: null,
          borderBottomStyle: null, borderLeftStyle: null,
        } : {
          borderTopStyle: null, borderRightStyle: null,
          borderBottomStyle: null, borderLeftStyle: null,
        }),
      });
    }
  };

  const handleCustomStyleToggle = (enabled) => {
    setCustomBorderStyle(enabled);
    if (!enabled) {
      const hasValue = (v) => v?.value && v.value !== '';
      if (!useIndividualSides) {
        const hasWidth = hasValue(borderWidth);
        updateCustomStyle({
          borderStyle: hasWidth ? 'solid' : null,
          borderTopStyle: null, borderRightStyle: null,
          borderBottomStyle: null, borderLeftStyle: null,
        });
      } else {
        updateCustomStyle({
          borderStyle: null,
          borderTopStyle:    hasValue(borderTopWidth)    ? 'solid' : null,
          borderRightStyle:  hasValue(borderRightWidth)  ? 'solid' : null,
          borderBottomStyle: hasValue(borderBottomWidth) ? 'solid' : null,
          borderLeftStyle:   hasValue(borderLeftWidth)   ? 'solid' : null,
        });
      }
    }
  };

  const handleRadiusToggle = (enabled) => {
    setUseIndividualRadius(enabled);
    if (enabled) {
      if (borderRadius) {
        updateCustomStyle({
          borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
          borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius,
          borderRadius: null,
        });
      }
    } else {
      updateCustomStyle({
        borderRadius: borderTopLeftRadius || null,
        borderTopLeftRadius: null, borderTopRightRadius: null,
        borderBottomLeftRadius: null, borderBottomRightRadius: null,
      });
    }
  };

  const handleUnifiedWidthChange = (val) => {
    const isEmpty = val.value === '' || val.value === null || val.value === undefined;
    const isSpecialUnit = val.unit === 'custom' || val.unit === 'size-presets' || val.unit === 'font-size-presets';
    updateCustomStyle({
      borderWidth: isEmpty && !isSpecialUnit ? null : { value: val.value, unit: val.unit },
    });
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <PanelBody title={<PanelTitle title="Border" isModified={isModified} />} initialOpen={false}>

      {/* Options */}
      <ToggleControl
        label="Individual sides"
        checked={useIndividualSides}
        onChange={handleSidesToggle}
      />
      <ToggleControl
        label="Custom border style"
        checked={customBorderStyle}
        onChange={handleCustomStyleToggle}
      />

      <hr style={{ margin: '12px 0', borderTop: '1px solid #ddd' }} />

      {/* Unified */}
      {!useIndividualSides && (
        <>
          <Flex align="center" justify="space-between" style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#1e1e1e' }}>
              <ControlLabel
                label="Border"
                isSet={
                  isStylePropSet(customStyle, 'borderWidth') ||
                  isStylePropSet(customStyle, 'borderStyle') ||
                  isStylePropSet(customStyle, 'borderColor')
                }
              />
            </span>

            {customBorderStyle && (
              <FlexItem style={{ flex: 1, margin: '0 6px' }}>
                <SelectControl
                  value={borderStyle || ''}
                  options={STYLE_OPTIONS}
                  onChange={(val) => updateCustomStyle({ borderStyle: val || null })}
                  __nextHasNoMarginBottom
                />
              </FlexItem>
            )}

            <Dropdown
              renderToggle={({ onToggle }) => (
                <Flex align="center" style={{ gap: '6px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1e1e1e' }}>
                    <ControlLabel label="Color" isSet={isStylePropSet(customStyle, 'borderColor')} />
                  </span>
                  <ColorButton
                    color={borderColor}
                    label="border color"
                    onClick={onToggle}
                  />
                  {isStylePropSet(customStyle, 'borderColor') && (
                    <Button
                      isSmall
                      variant="tertiary"
                      onClick={() => updateCustomStyle({ borderColor: null })}
                      style={{ border: '1px solid currentColor', padding: '2px 6px', lineHeight: 1 }}
                      aria-label="Clear border color"
                      title="Clear border color"
                    >
                      ×
                    </Button>
                  )}
                </Flex>
              )}
              renderContent={({ onClose }) => (
                <div style={{ width: '320px' }}>
                  <Flex justify="flex-end" style={{ marginBottom: '4px' }}>
                    <Button
                      isSmall
                      variant="tertiary"
                      onClick={onClose}
                      aria-label="Close color picker"
                    >
                      ×
                    </Button>
                  </Flex>
                  <ColorControls
                    customStyle={customStyle}
                    updateCustomStyle={updateCustomStyle}
                    property="borderColor"
                    label="Border Color"
                    usePanelBody={false}
                  />
                </div>
              )}
              placement="left-start"
              contentClassName="border-color-popover"
            />
          </Flex>

          <UnitControls
            label={<ControlLabel label="Width" isSet={isStylePropSet(customStyle, 'borderWidth')} />}
            value={borderWidth}
            onChange={handleUnifiedWidthChange}
            allowedUnits={WIDTH_UNITS}
            keywords={KEYWORDS_GLOBAL}
          />
        </>
      )}
      <div className='tmsblocks-separator'></div>
      {/* Individual sides */}
      {useIndividualSides && (
        <>
          {SIDES.map(({ label, widthProp, styleProp, colorProp }, i) => (
            <React.Fragment key={label}>
              <BorderSideRow
                label={label}
                widthProp={widthProp}
                styleProp={styleProp}
                colorProp={colorProp}
                customStyle={customStyle}
                updateCustomStyle={updateCustomStyle}
                customBorderStyle={customBorderStyle}
              />
              {i < SIDES.length - 1 && (
                <hr style={{ margin: '8px 0', borderTop: '1px solid #eee' }} />
              )}
            </React.Fragment>
          ))}
          <div className='tmsblocks-separator'></div>
        </>
      )}

      <hr style={{ margin: '16px 0', borderTop: '1px solid #ddd' }} />

      {/* Radius */}
      <ToggleControl
        label="Individual corner radii"
        checked={useIndividualRadius}
        onChange={handleRadiusToggle}
      />

      {!useIndividualRadius ? (
        <UnitControls
          label={<ControlLabel label="Border Radius" isSet={isStylePropSet(customStyle, 'borderRadius')} />}
          value={borderRadius}
          onChange={(val) => updateCustomStyle({ borderRadius: { value: val.value, unit: val.unit } })}
          allowedUnits={RADIUS_UNITS}
          keywords={KEYWORDS_GLOBAL}
        />
      ) : (
        CORNERS.map(({ label, prop }) => (
          <UnitControls
            key={prop}
            label={<ControlLabel label={label} isSet={isStylePropSet(customStyle, prop)} />}
            value={customStyle[prop]}
            onChange={(val) => updateCustomStyle({ [prop]: { value: val.value, unit: val.unit } })}
            allowedUnits={RADIUS_UNITS}
            keywords={KEYWORDS_GLOBAL}
          />
        ))
      )}
      {isModified && (
        <Button
          variant="secondary"
          isDestructive
          onClick={() => updateCustomStyle({
            borderWidth: null,
            borderStyle: null,
            borderColor: null,
            borderTopWidth: null,
            borderRightWidth: null,
            borderBottomWidth: null,
            borderLeftWidth: null,
            borderTopStyle: null,
            borderRightStyle: null,
            borderBottomStyle: null,
            borderLeftStyle: null,
            borderTopColor: null,
            borderRightColor: null,
            borderBottomColor: null,
            borderLeftColor: null,
            borderRadius: null,
            borderTopLeftRadius: null,
            borderTopRightRadius: null,
            borderBottomRightRadius: null,
            borderBottomLeftRadius: null,
          })}
          style={{ marginTop: '8px' }}
        >
          Clear panel properties
        </Button>
      )}
    </PanelBody>
  );
}

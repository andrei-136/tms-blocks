/**
 * COLOR CONTROLS
 *
 * Two display variants:
 * - 'full'   (default) - full UI with large swatch, hex value, clear, and theme palette
 * - 'button' - small swatch button that opens a Dropdown with the two-step color UI inside
 *
 * usePanelBody prop still supported for embedding without a PanelBody wrapper.
 */

import React, { useState, useRef } from 'react';
import {
  Button,
  ColorPalette,
  ColorPicker,
  Flex,
  PanelBody,
  Popover,
  Dropdown,
} from '@wordpress/components';
import { useSettings } from '@wordpress/block-editor';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { hasModifiedStyleProps } from '../style-utils';

// --- Checkerboard -------------------------------------------------------------

const CHECKERBOARD = `
  linear-gradient(45deg, #ccc 25%, transparent 25%),
  linear-gradient(-45deg, #ccc 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #ccc 75%),
  linear-gradient(-45deg, transparent 75%, #ccc 75%)
`.trim();

const PRESET_COLOR_VAR_REGEX = /^var\(--wp--preset--color--([^)]+)\)$/;

function resolveDisplayedColorValue(value, colors = []) {
  if (typeof value !== 'string' || !value) return value || '';

  const match = value.match(PRESET_COLOR_VAR_REGEX);
  if (!match) return value;

  return colors.find(({ slug }) => slug === match[1])?.color || value;
}

function mapPaletteColorToStoredValue(value, colors = []) {
  if (!value) return null;

  const normalized = String(value).toLowerCase();
  const preset = colors.find(({ color, slug }) => (
    slug && color && String(color).toLowerCase() === normalized
  ));

  return preset?.slug ? `var(--wp--preset--color--${preset.slug})` : value;
}

// --- Two-step color picker UI ------------------------------------------------

function ColorPickerUI({ currentValue, pickerValue, paletteValue, colors, onCustomChange, onPaletteChange, onClear }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [valueBeforePicker, setValueBeforePicker] = useState(null);
  const swatchRef = useRef(null);

  const handleOpenPicker = () => {
    setValueBeforePicker(currentValue);
    setPickerOpen(true);
  };

  const handleClosePicker = () => {
    setPickerOpen(false);
  };

  const handleCancelPicker = () => {
    onCustomChange(valueBeforePicker);
    setPickerOpen(false);
  };

  return (
    <div>
      {/* Large preview swatch - clickable, with edit icon */}
      <div
        ref={swatchRef}
        onClick={handleOpenPicker}
        title="Click to edit color"
        style={{
          position: 'relative',
          width: '100%',
          height: '64px',
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.1)',
          marginBottom: '8px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundImage: CHECKERBOARD,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundColor: currentValue || 'transparent' }} />

        {/* Edit icon - top left */}
        <span style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          width: '20px',
          height: '20px',
          borderRadius: '3px',
          backgroundColor: 'rgba(255,255,255,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="#1e1e1e">
            <path d="M20.1 5.1L18.9 3.9c-.8-.8-2-.8-2.8 0l-1.6 1.6 4 4 1.6-1.6c.8-.8.8-2 0-2.8zM3 17.2V21h3.8l11-11-4-4L3 17.2z"/>
          </svg>
        </span>
      </div>

      {/* Picker popover anchored to swatch */}
      {pickerOpen && (
        <Popover
          anchor={swatchRef.current}
          placement="left-start"
          onClose={handleClosePicker}
          shift
          flip
        >
          <div style={{ padding: '12px', width: '260px' }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Custom color</span>
              <Button isSmall variant="tertiary" onClick={handleClosePicker} aria-label="Close">×</Button>
            </Flex>

            <ColorPicker
              color={pickerValue || ''}
              onChange={onCustomChange}
              enableAlpha
              defaultValue=""
            />

            <Flex justify="flex-start" style={{ marginTop: '2px' }}>
              <Button isSmall variant="tertiary" onClick={handleCancelPicker}>
                Cancel
              </Button>
            </Flex>
          </div>
        </Popover>
      )}

      {/* State label */}
      <p style={{
        fontSize: '12px',
        color: 'var(--tmsblocks-text-muted, #4a5a5a)',
        marginBottom: '12px',
        fontFamily: currentValue ? 'monospace' : 'inherit',
      }}>
        {currentValue || 'No color selected'}
      </p>

      {/* Theme palette */}
      {colors.length > 0 && (
        <div style={{ marginBottom: '2px' }}>
          <span style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'var(--tmsblocks-text-muted, #4a5a5a)',
            display: 'block',
            marginBottom: '2px',
          }}>
            Theme
          </span>
          <ColorPalette
            colors={colors}
            value={paletteValue}
            onChange={onPaletteChange}
            clearable={false}
            disableCustomColors
          />
        </div>
      )}

      {/* Footer - clear only */}
      {currentValue && (
        <Flex justify="flex-end" style={{ marginTop: '2px' }}>
          <Button isSmall isDestructive variant="tertiary" onClick={onClear}>
            Clear
          </Button>
        </Flex>
      )}
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export default function ColorControls({
  customStyle = {},
  updateCustomStyle,
  property = 'color',
  label = 'Color',
  usePanelBody = true,
  variant = 'full',
  clearAsIcon = false,
  showToggleMarker = true,
}) {
  const isModified = hasModifiedStyleProps(customStyle, [property]);
  const currentValue = customStyle[property] || '';
  const hasLabel = label !== null && label !== undefined && label !== '';

  const [colors = []] = useSettings('color.palette');

  const displayedValue = resolveDisplayedColorValue(currentValue, colors);

  const handleCustomChange = (val) => updateCustomStyle(property, val || null);
  const handlePaletteChange = (val) => updateCustomStyle(property, mapPaletteColorToStoredValue(val, colors));
  const handleClear = () => updateCustomStyle(property, null);

  // --- Button variant --------------------------------------------------------

  if (variant === 'button') {
    return (
      <Dropdown
        renderToggle={({ onToggle }) => (
          <Flex align="center" gap={2}>
            {hasLabel && (
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1e1e1e' }}>
                {showToggleMarker ? <ControlLabel label={label} isSet={isModified} /> : label}
              </span>
            )}
            {!hasLabel && showToggleMarker && isModified && (
              <span
                aria-hidden="true"
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--wp-admin-theme-color, #007cba)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            <Button
              isSmall
              onClick={onToggle}
              style={{ padding: '2px' }}
              aria-label={`Edit ${label || 'color'}`}
              title={`Edit ${label || 'color'}`}
            >
              <span style={{
                display: 'inline-block',
                width: '22px',
                height: '22px',
                borderRadius: '3px',
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: CHECKERBOARD,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                border: '1px solid #949494',
                verticalAlign: 'middle',
              }}>
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: currentValue || 'transparent',
                }} />
              </span>
            </Button>
            {currentValue && (
              <Button
                isSmall
                variant="tertiary"
                onClick={handleClear}
                style={{
                  border: '1px solid currentColor',
                  ...(clearAsIcon ? { padding: '2px 6px', lineHeight: 1 } : {}),
                }}
                aria-label={`Clear ${label || 'color'}`}
                title={`Clear ${label || 'color'}`}
              >
                {clearAsIcon ? '×' : 'Clear'}
              </Button>
            )}
          </Flex>
        )}
        renderContent={({ onClose }) => (
          <div style={{ width: '280px', padding: '12px' }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
              <Button isSmall variant="tertiary" onClick={onClose} aria-label="Close">×</Button>
            </Flex>
            <ColorPickerUI
              currentValue={currentValue}
              pickerValue={displayedValue}
              paletteValue={displayedValue}
              colors={colors}
              onCustomChange={handleCustomChange}
              onPaletteChange={handlePaletteChange}
              onClear={() => { handleClear(); onClose(); }}
            />
          </div>
        )}
        placement="left-start"
        contentClassName="tmsblocks-color-popover"
      />
    );
  }

  // --- Full variant ----------------------------------------------------------

  const controls = (
    <div style={{ marginBottom: '8px' }}>
      <ColorPickerUI
        currentValue={currentValue}
        pickerValue={displayedValue}
        paletteValue={displayedValue}
        colors={colors}
        onCustomChange={handleCustomChange}
        onPaletteChange={handlePaletteChange}
        onClear={handleClear}
      />
    </div>
  );

  if (!usePanelBody) return controls;

  return (
    <PanelBody title={<PanelTitle title={label} isModified={isModified} />} initialOpen={false}>
      {controls}
      {isModified && (
        <Button variant="secondary" isDestructive onClick={handleClear} style={{ marginTop: '8px' }}>
          Clear panel properties
        </Button>
      )}
    </PanelBody>
  );
}

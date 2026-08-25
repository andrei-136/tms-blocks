import React from 'react';
import {
  TextControl,
  SelectControl,
  Flex,
  FlexItem,
  Button,
  ButtonGroup,
} from '@wordpress/components';
import { useSettings } from '@wordpress/block-editor';

export const KEYWORDS_GLOBAL = [
  { label: 'inherit', value: 'inherit' },
  { label: 'initial', value: 'initial' },
  { label: 'unset', value: 'unset' },
  { label: 'revert', value: 'revert' },
  { label: 'revert-layer', value: 'revert-layer' },
];

export const KEYWORDS_SIZING = [
  { label: 'auto', value: 'auto' },
  { label: 'content', value: 'content' },
  { label: 'min-content', value: 'min-content' },
  { label: 'max-content', value: 'max-content' },
  { label: 'fit-content', value: 'fit-content' },
];

export const KEYWORDS_TEXT = [
  { label: 'none', value: 'none' },
  { label: 'normal', value: 'normal' },
];

// All known keywords - derived from the exported groups.
// Used internally to recognize keyword-type values regardless of what's shown in the UI.
const KEYWORD_UNITS = new Set([
  ...KEYWORDS_GLOBAL,
  ...KEYWORDS_SIZING,
  ...KEYWORDS_TEXT,
].map((k) => k.value));

// Default keywords shown in the dropdown when no keywords prop is passed.
const KEYWORDS_DROPDOWN_OPTIONS = [
  ...KEYWORDS_GLOBAL,
  ...KEYWORDS_SIZING,
  ...KEYWORDS_TEXT,
];

const LAYOUT_PRESET_OPTIONS = [
  { label: 'Content', value: 'content' },
  { label: 'Wide', value: 'wide' },
];

const PRESET_DROPDOWN_THRESHOLD = 4;

const getUnitLabel = (u) => {
  if (u === 'size-presets') return 'Size Presets';
  if (u === 'font-size-presets') return 'Font Size Presets';
  if (u === 'layout-presets') return 'Layout Presets';
  if (u === 'custom') return 'Custom';
  if (u === 'unitless') return 'Unitless';
  if (u === 'keywords') return 'Keywords';
  return u;
};

export default function UnitControls({
  label,
  value,
  onChange,
  allowedUnits = ['px', 'rem', 'em', '%', 'vw', 'vh', 'unitless', 'custom', 'size-presets'],
  excludeUnits = [],
  includeUnits = [],
  allow = [],
  keywords = KEYWORDS_DROPDOWN_OPTIONS,
  min = 0,
  max = 500,
}) {
  const [spacingSizes = [], allFontSizes = [], themeFontSizes = [], customFontSizes = []] = useSettings(
    'spacing.spacingSizes',
    'typography.fontSizes',
    'typography.fontSizes.theme',
    'typography.fontSizes.custom'
  );

  const fontSizePresets = (() => {
    const seen = new Set();
    const merged = [];
    for (const preset of [...themeFontSizes, ...customFontSizes, ...allFontSizes]) {
      if (!preset?.slug || seen.has(preset.slug)) continue;
      seen.add(preset.slug);
      merged.push(preset);
    }
    return merged;
  })();

  const baseAllowedUnits = [...new Set(allowedUnits)];
  const mergedIncludeUnits = [...new Set([...includeUnits, ...allow])];
  const mergedExcludeUnits = [...new Set(excludeUnits)];
  const expandedAllowedUnits = [...new Set([...baseAllowedUnits, ...mergedIncludeUnits])];
  const filteredAllowedUnits = expandedAllowedUnits.filter(
    (name) => !mergedExcludeUnits.includes(name)
  );
  const effectiveUnits = filteredAllowedUnits.length > 0
    ? filteredAllowedUnits
    : expandedAllowedUnits;

  const parseValue = (val) => {
    if (!val || typeof val !== 'object') {
      return { number: '', unit: effectiveUnits[0] ?? 'px' };
    }
    const { value: numValue, unit: unitValue } = val;
    return { number: numValue ?? '', unit: unitValue ?? effectiveUnits[0] ?? 'px' };
  };

  const { number, unit } = parseValue(value);

  const selectValue = (() => {
    if (effectiveUnits.includes(unit)) return unit;
    if (unit === 'keyword' && effectiveUnits.includes(number)) return number;
    if (unit === 'keyword' && effectiveUnits.includes('keywords')) return 'keywords';
    if (KEYWORD_UNITS.has(unit) && effectiveUnits.includes('keywords')) return 'keywords';
    return effectiveUnits[0] ?? unit;
  })();

  const selectedPresetName = unit === 'size-presets'
    ? spacingSizes.find((size) => size.slug === number)?.name
    : unit === 'font-size-presets'
    ? fontSizePresets.find((preset) => preset.slug === number)?.name
    : unit === 'layout-presets'
    ? LAYOUT_PRESET_OPTIONS.find((preset) => preset.value === number)?.label
    : null;

  const handleValueChange = (val) => {
    if (unit === 'custom') {
      onChange({ value: val, unit });
    } else {
      if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
        onChange({ value: val, unit });
      }
    }
  };

  const handleUnitChange = (newUnit) => {
    if (KEYWORD_UNITS.has(newUnit)) {
      onChange({ value: newUnit, unit: 'keyword' });
      return;
    }

    if (newUnit === 'keywords') {
      const firstKeyword = keywordsDropdownOptions.find(
        (opt) => !effectiveUnits.includes(opt.value)
      )?.value ?? keywords[0]?.value ?? 'inherit';
      onChange({ value: firstKeyword, unit: 'keyword' });
      return;
    }

    if (newUnit === 'size-presets' && spacingSizes.length > 0) {
      onChange({ value: spacingSizes[0].slug, unit: 'size-presets' });
    } else if (newUnit === 'layout-presets') {
      onChange({ value: LAYOUT_PRESET_OPTIONS[0].value, unit: 'layout-presets' });
    } else if (newUnit === 'font-size-presets' && fontSizePresets.length > 0) {
      onChange({ value: fontSizePresets[0].slug, unit: 'font-size-presets' });
    } else if (newUnit === 'custom') {
      onChange({ value: '', unit: 'custom' });
    } else if (newUnit === 'unitless') {
      const isComingFromNumericUnit = !['custom', 'size-presets', 'font-size-presets', 'layout-presets', 'keyword', ...KEYWORD_UNITS].includes(unit);
      const isValidNumber = number && /^-?\d*\.?\d*$/.test(number);
      onChange({ value: (isComingFromNumericUnit && isValidNumber) ? number : '', unit: 'unitless' });
    } else {
      const isComingFromNumericUnit = !['custom', 'size-presets', 'font-size-presets', 'layout-presets', 'keyword', ...KEYWORD_UNITS].includes(unit);
      const isValidNumber = number && /^-?\d*\.?\d*$/.test(number);
      onChange({ value: (isComingFromNumericUnit && isValidNumber) ? number : '', unit: newUnit });
    }
  };

  const handleKeywordDropdownChange = (newKeyword) => {
    onChange({ value: newKeyword, unit: 'keyword' });
  };

  const handlePresetClick = (slug) => {
    if (number === slug) {
      onChange({ value: '', unit });
    } else {
      onChange({ value: slug, unit });
    }
  };

  const selectOptions = effectiveUnits.map((u) => ({
    label: getUnitLabel(u),
    value: u,
  }));

  const keywordsDropdownOptions = keywords.filter(
    (opt) => !effectiveUnits.includes(opt.value)
  );

  const currentKeywordValue = unit === 'keyword'
    ? number
    : (KEYWORD_UNITS.has(unit) && !effectiveUnits.includes(unit))
    ? unit
    : keywordsDropdownOptions[0]?.value ?? 'inherit';

  return (
    <div style={{ marginBottom: '0px', marginTop: '0px', outline: '0px solid #ccc', outlineOffset: '4px' }}>
      <label
        style={{
          fontSize: '11px',
          fontWeight: 500,
          textTransform: 'uppercase',
          display: 'block',
        }}
      >
        {label}
      </label>
      <Flex align="start" justify="space-between" gap="2px">
        
          <SelectControl
         
            value={selectValue}
            options={selectOptions}
            onChange={handleUnitChange}
            __nextHasNoMarginBottom
          />
        
        <FlexItem style={{ marginBottom: '0px' }}>
          {(unit === 'keyword' && effectiveUnits.includes(number)) || (KEYWORD_UNITS.has(unit) && effectiveUnits.includes(unit)) ? (
            <span style={{ fontSize: '12px', color: '#757575', padding: '6px 8px', display: 'inline-block' }}>
              {unit === 'keyword' ? number : unit}
            </span>

          ) : unit === 'keywords' || unit === 'keyword' || (KEYWORD_UNITS.has(unit) && !effectiveUnits.includes(unit)) ? (
            <SelectControl
              value={currentKeywordValue}
              options={keywordsDropdownOptions}
              onChange={handleKeywordDropdownChange}
              __nextHasNoMarginBottom
            />

          ) : unit === 'size-presets' ? (
            <div>
              {spacingSizes.length > 0 ? (
                <>
                  {spacingSizes.length > PRESET_DROPDOWN_THRESHOLD ? (
                    <SelectControl
                      value={number}
                      options={[
                        { label: '— None —', value: '' },
                        ...spacingSizes.map((size) => ({
                          label: size.name,
                          value: size.slug,
                        })),
                      ]}
                      onChange={(slug) => handlePresetClick(slug)}
                      __nextHasNoMarginBottom
                    />
                  ) : (
                    <ButtonGroup style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {spacingSizes.map((size) => (
                        <Button
                          key={size.slug}
                          variant={number === size.slug ? 'primary' : 'secondary'}
                          onClick={() => handlePresetClick(size.slug)}
                        >
                          {size.name}
                        </Button>
                      ))}
                    </ButtonGroup>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#757575', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                  No spacing presets available in theme.
                </div>
              )}
            </div>

          ) : unit === 'font-size-presets' ? (
            <div>
              {fontSizePresets.length > 0 ? (
                <>
                  {fontSizePresets.length > PRESET_DROPDOWN_THRESHOLD ? (
                    <SelectControl
                      value={number}
                      options={[
                        { label: '— None —', value: '' },
                        ...fontSizePresets.map((preset) => ({
                          label: preset.name,
                          value: preset.slug,
                        })),
                      ]}
                      onChange={(slug) => handlePresetClick(slug)}
                      __nextHasNoMarginBottom
                    />
                  ) : (
                    <ButtonGroup style={{ marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {fontSizePresets.map((preset) => (
                        <Button
                          key={preset.slug}
                          variant={number === preset.slug ? 'primary' : 'secondary'}
                          onClick={() => handlePresetClick(preset.slug)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </ButtonGroup>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#757575', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                  No font size presets available in theme.
                </div>
              )}
            </div>

          ) : unit === 'layout-presets' ? (
            <div>
              <ButtonGroup style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {LAYOUT_PRESET_OPTIONS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={number === preset.value ? 'primary' : 'secondary'}
                    onClick={() => handlePresetClick(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </ButtonGroup>
              {selectedPresetName && (
                <div style={{ fontSize: '12px', color: '#757575' }}>
                  Selected: {selectedPresetName}
                </div>
              )}
            </div>

          ) : unit === 'custom' ? (
            <TextControl
              type="text"
              value={number}
              onChange={handleValueChange}
              placeholder="e.g., calc(10px + 2rem)"
              __nextHasNoMarginBottom
            />

          ) : (
            <TextControl
              type="number"
              value={number}
              onChange={handleValueChange}
              __nextHasNoMarginBottom
            />
          )}
        </FlexItem>
      </Flex>
    </div>
  );
}

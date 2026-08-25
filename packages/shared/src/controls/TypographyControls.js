import React from 'react';
import { PanelBody, SelectControl, Button, ToggleControl } from '@wordpress/components';
import { useSettings } from '@wordpress/block-editor';
import UnitControls from './UnitControls';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { getModificationLevel, MODIFICATION_LEVEL_COLORS } from '../style-utils';

const TYPOGRAPHY_PROPS = [
  'fontFamily',
  'textAlign',
  'fontSize',
  'lineHeight',
  'fontWeight',
  'fontStyle',
  'textTransform',
  'textDecoration',
  'letterSpacing',
  'textWrap',
  'whiteSpace',
  'wordBreak',
  'textIndent'
];

const PROP_LABELS = {
  fontFamily: 'Font Family',
  textAlign: 'Text Align',
  fontSize: 'Font Size',
  lineHeight: 'Line Height',
  fontWeight: 'Font Weight',
  fontStyle: 'Font Style',
  textTransform: 'Text Transform',
  textDecoration: 'Text Decoration',
  letterSpacing: 'Letter Spacing',
  textWrap: 'Text Wrap',
  whiteSpace: 'White Space',
  wordBreak: 'Word Break',
  textIndent: 'Text Indent',
};

const TYPOGRAPHY_ADVANCED_PROPS = ['textWrap', 'whiteSpace', 'wordBreak', 'textIndent'];

const flattenFontFamilies = (setting) => {
  if (!setting) return [];
  if (Array.isArray(setting)) return setting.flatMap((item) => flattenFontFamilies(item));
  if (typeof setting === 'object') {
    if (setting.fontFamily) return [setting];
    if (Array.isArray(setting.fontFamilies)) return flattenFontFamilies(setting.fontFamilies);
    return Object.values(setting).flatMap((group) => flattenFontFamilies(group));
  }
  return [];
};

const buildFontFamilyOptions = (fontFamiliesSetting) => {
  const fonts = flattenFontFamilies(fontFamiliesSetting);
  const options = [{ label: 'Default', value: '' }];
  const seen = new Set();

  const formatPresetName = (slug = '') => slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  fonts.forEach((font) => {
    const baseLabel = font.name || font.fontFamily || font.slug;
    const presetName = font.slug ? formatPresetName(font.slug) : '';
    const label = presetName && baseLabel ? `${presetName} (${baseLabel})` : baseLabel;
    const value = (font.slug ? `var(--wp--preset--font-family--${font.slug})` : '') || font.fontFamily;
    if (!label || !value || seen.has(value)) return;
    seen.add(value);
    options.push({ label, value });
  });

  return options;
};

const GROUP_STYLE = (bg) => ({
  background: bg,
  borderRadius: '4px',
  padding: '8px',
  marginBottom: '4px',
});

const TEXT_INDENT_NUMERIC_UNITS = ['px', 'rem', 'em', '%'];

const parseTextIndent = (rawValue, fallbackUnit = 'px') => {
  const raw = typeof rawValue === 'object' && rawValue?.value !== undefined
    ? String(rawValue.value || '')
    : String(rawValue || '');

  const hasHanging = /\bhanging\b/.test(raw);
  const hasEachLine = /\beach-line\b/.test(raw);
  const lengthPart = raw.replace(/\b(hanging|each-line)\b/g, '').trim();

  if (!lengthPart) {
    return { value: '', unit: fallbackUnit, hasHanging, hasEachLine };
  }

  const match = lengthPart.match(/^(-?(?:\d+|\d*\.\d+))(px|rem|em|%)$/);
  if (match) {
    return { value: match[1], unit: match[2], hasHanging, hasEachLine };
  }

  return { value: lengthPart, unit: 'custom', hasHanging, hasEachLine };
};

const composeTextIndent = ({ value, unit, hasHanging, hasEachLine }) => {
  const normalizedValue = String(value ?? '').trim();
  const normalizedUnit = unit || 'px';
  const length = normalizedValue
    ? `${normalizedValue}${normalizedUnit === 'custom' ? '' : normalizedUnit}`
    : '';

  const parts = [
    length,
    hasHanging && 'hanging',
    hasEachLine && 'each-line',
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : null;
};

export default function TypographyControls({ customStyle, updateCustomStyle, masterStyle = null }) {
  const [textIndentUnit, setTextIndentUnit] = React.useState('px');

  const [
    fontFamiliesSetting = [],
    themeFontFamilies = [],
    customFontFamilies = []
  ] = useSettings(
    'typography.fontFamilies',
    'typography.fontFamilies.theme',
    'typography.fontFamilies.custom'
  );

  const fontFamilyOptions = buildFontFamilyOptions([
    fontFamiliesSetting,
    themeFontFamilies,
    customFontFamilies
  ]);

  const typoLevel = getModificationLevel(customStyle, TYPOGRAPHY_PROPS, masterStyle);
  const typoAdvancedLevel = getModificationLevel(customStyle, TYPOGRAPHY_ADVANCED_PROPS, masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;

  // Only show properties that are overridden (orange, level 3) on instances, or set on standalone
  const overriddenProps = TYPOGRAPHY_PROPS.filter(
    (p) => getModificationLevel(customStyle, [p], masterStyle) >= (masterStyle ? 3 : 1)
  );
  const hasOverrides = overriddenProps.length > 0;

  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const parsedTextIndent = React.useMemo(
    () => parseTextIndent(customStyle.textIndent, textIndentUnit),
    [customStyle.textIndent, textIndentUnit]
  );

  return (
    <PanelBody title={<PanelTitle title="Typography" level={typoLevel} />} initialOpen={false}>

      {/* Type properties group */}
      <div style={GROUP_STYLE('hsl(251, 50%, 94%)')}>
        <SelectControl
          label={<ControlLabel label="Font Family" level={getLevel('fontFamily')} />}
          value={customStyle.fontFamily || ''}
          options={fontFamilyOptions}
          onChange={(val) => updateCustomStyle('fontFamily', val || null)}
        />

        <UnitControls
          label={<ControlLabel label="Font Size" level={getLevel('fontSize')} />}
          value={customStyle.fontSize}
          onChange={(val) => updateCustomStyle('fontSize', val.value, val.unit)}
          allowedUnits={['px', 'rem', 'em', '%', 'vw', 'vh', 'custom', 'font-size-presets']}
        />

        <SelectControl
          label={<ControlLabel label="Font Weight" level={getLevel('fontWeight')} />}
          value={
            typeof customStyle.fontWeight === 'object' && customStyle.fontWeight !== null && 'value' in customStyle.fontWeight
              ? String(customStyle.fontWeight.value)
              : (customStyle.fontWeight || '')
          }
          options={[
            { label: 'Default', value: '' },
            { label: 'Thin (100)', value: '100' },
            { label: 'Extra Light (200)', value: '200' },
            { label: 'Light (300)', value: '300' },
            { label: 'Normal (400)', value: 'normal' },
            { label: 'Medium (500)', value: '500' },
            { label: 'Semi Bold (600)', value: '600' },
            { label: 'Bold (700)', value: 'bold' },
            { label: 'Extra Bold (800)', value: '800' },
            { label: 'Black (900)', value: '900' },
            { label: 'Bolder', value: 'bolder' },
            { label: 'Lighter', value: 'lighter' },
          ]}
          onChange={(val) => updateCustomStyle('fontWeight', val || null)}
        />

        <SelectControl
          label={<ControlLabel label="Font Style" level={getLevel('fontStyle')} />}
          value={customStyle.fontStyle || ''}
          options={[
            { label: 'Default', value: '' },
            { label: 'Normal', value: 'normal' },
            { label: 'Italic', value: 'italic' },
            { label: 'Oblique', value: 'oblique' },
          ]}
          onChange={(val) => updateCustomStyle('fontStyle', val || null)}
        />

        <UnitControls
          label={<ControlLabel label="Line Height" level={getLevel('lineHeight')} />}
          value={customStyle.lineHeight}
          onChange={(val) => updateCustomStyle('lineHeight', val.value, val.unit)}
          allowedUnits={['unitless', 'em', 'rem', 'px', '%', 'custom']}
        />

        <UnitControls
          label={<ControlLabel label="Letter Spacing" level={getLevel('letterSpacing')} />}
          value={customStyle.letterSpacing}
          onChange={(val) => updateCustomStyle('letterSpacing', val.value, val.unit)}
          allowedUnits={['px', 'em', 'rem', '%', 'custom']}
        />
      </div>

      {/* Text styling group */}
      <div style={GROUP_STYLE('hsl(251, 50%, 91%)')}>
        <SelectControl
          label={<ControlLabel label="Text Align" level={getLevel('textAlign')} />}
          value={customStyle.textAlign || ''}
          options={[
            { label: 'Default', value: '' },
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
            { label: 'Justify', value: 'justify' }
          ]}
          onChange={(val) => updateCustomStyle('textAlign', val || null)}
        />

        <SelectControl
          label={<ControlLabel label="Text Transform" level={getLevel('textTransform')} />}
          value={customStyle.textTransform || ''}
          options={[
            { label: 'Default', value: '' },
            { label: 'None', value: 'none' },
            { label: 'Capitalize', value: 'capitalize' },
            { label: 'Uppercase', value: 'uppercase' },
            { label: 'Lowercase', value: 'lowercase' }
          ]}
          onChange={(val) => updateCustomStyle('textTransform', val || null)}
        />

        <SelectControl
          label={<ControlLabel label="Text Decoration" level={getLevel('textDecoration')} />}
          value={customStyle.textDecoration || ''}
          options={[
            { label: 'Default', value: '' },
            { label: 'None', value: 'none' },
            { label: 'Underline', value: 'underline' },
            { label: 'Overline', value: 'overline' },
            { label: 'Line Through', value: 'line-through' }
          ]}
          onChange={(val) => updateCustomStyle('textDecoration', val || null)}
        />
      </div>

      {/* Advanced */}
      <div style={{ marginTop: '4px' }}>
        <PanelBody
          title={<PanelTitle title="Advanced" level={typoAdvancedLevel} />}
          initialOpen={false}
          style={{ margin: 0, padding: 0 }}
        >
          <div style={{ margin: '-16px', marginTop: '4px' }}>
            <SelectControl
              label={<ControlLabel label="Text Wrap" level={getLevel('textWrap')} />}
              value={customStyle.textWrap || ''}
              options={[
                { label: 'Default', value: '' },
                { label: 'Wrap', value: 'wrap' },
                { label: 'Nowrap', value: 'nowrap' },
                { label: 'Balance', value: 'balance' },
                { label: 'Pretty', value: 'pretty' }
              ]}
              onChange={(val) => updateCustomStyle('textWrap', val || null)}
            />

            <SelectControl
              label={<ControlLabel label="White Space" level={getLevel('whiteSpace')} />}
              value={customStyle.whiteSpace || ''}
              options={[
                { label: 'Default', value: '' },
                { label: 'Normal', value: 'normal' },
                { label: 'Wrap', value: 'wrap' },
                { label: 'Nowrap', value: 'nowrap' },
                { label: 'Pre', value: 'pre' },
                { label: 'Pre Wrap', value: 'pre-wrap' },
                { label: 'Pre Line', value: 'pre-line' }
              ]}
              onChange={(val) => updateCustomStyle('whiteSpace', val || null)}
            />

            <SelectControl
              label={<ControlLabel label="Word Break" level={getLevel('wordBreak')} />}
              value={customStyle.wordBreak || ''}
              options={[
                { label: 'Default', value: '' },
                { label: 'Normal', value: 'normal' },
                { label: 'Break All', value: 'break-all' },
                { label: 'Break Word', value: 'break-word' },
                { label: 'Keep All', value: 'keep-all' }
              ]}
              onChange={(val) => updateCustomStyle('wordBreak', val || null)}
            />

            {/* Text Indent */}
            <div>
              <ControlLabel label="Text Indent" level={getLevel('textIndent')} />
              <UnitControls
                label={null}
                value={{ value: parsedTextIndent.value, unit: parsedTextIndent.unit }}
                onChange={(val) => {
                  const nextUnit = val?.unit || textIndentUnit;
                  const nextValue = val?.value ?? '';
                  setTextIndentUnit(nextUnit);
                  updateCustomStyle(
                    'textIndent',
                    composeTextIndent({
                      value: nextValue,
                      unit: nextUnit,
                      hasHanging: parsedTextIndent.hasHanging,
                      hasEachLine: parsedTextIndent.hasEachLine,
                    })
                  );
                }}
                allowedUnits={[...TEXT_INDENT_NUMERIC_UNITS, 'custom']}
              />
              <ToggleControl
                label="hanging"
                checked={parsedTextIndent.hasHanging}
                onChange={(checked) => {
                  updateCustomStyle(
                    'textIndent',
                    composeTextIndent({
                      value: parsedTextIndent.value,
                      unit: parsedTextIndent.unit,
                      hasHanging: checked,
                      hasEachLine: parsedTextIndent.hasEachLine,
                    })
                  );
                }}
                __nextHasNoMarginBottom
              />
              <ToggleControl
                label="each-line"
                checked={parsedTextIndent.hasEachLine}
                onChange={(checked) => {
                  updateCustomStyle(
                    'textIndent',
                    composeTextIndent({
                      value: parsedTextIndent.value,
                      unit: parsedTextIndent.unit,
                      hasHanging: parsedTextIndent.hasHanging,
                      hasEachLine: checked,
                    })
                  );
                }}
                __nextHasNoMarginBottom
              />
            </div>
          </div>
        </PanelBody>
      </div>

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
            onClick={() => {
              const resetValues = {};
              overriddenProps.forEach((p) => { resetValues[p] = resetToMaster(p); });
              updateCustomStyle(resetValues);
            }}
          >
            {clearLabel} panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

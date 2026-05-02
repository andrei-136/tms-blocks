import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Flex,
  PanelBody,
  RangeControl,
  SelectControl,
  TextareaControl,
  TextControl,
} from '@wordpress/components';
import { useSettings } from '@wordpress/block-editor';
import PanelTitle from './PanelTitle';
import ColorControls from './ColorControls';
import { hasModifiedStyleProps } from '../style-utils';
import { generateUniqueId } from '../utils';

const CHECKERBOARD = `
  linear-gradient(45deg, #ccc 25%, transparent 25%),
  linear-gradient(-45deg, #ccc 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #ccc 75%),
  linear-gradient(-45deg, transparent 75%, #ccc 75%)
`.trim();

const PRESET_GRADIENT_VAR_REGEX = /^var\(--wp--preset--gradient--([^)]+)\)$/;

const MODE_OPTIONS = [
  { label: 'Build', value: 'build' },
  { label: 'Theme Preset', value: 'preset' },
  { label: 'Custom CSS', value: 'custom' },
];

const TYPE_OPTIONS = [
  { label: 'Linear', value: 'linear' },
  { label: 'Radial', value: 'radial' },
];

const RADIAL_SHAPE_OPTIONS = [
  { label: 'Ellipse', value: 'ellipse' },
  { label: 'Circle', value: 'circle' },
];

function createDefaultStops() {
  return [
    {
      id: generateUniqueId(),
      color: '#1d4ed8',
      position: { value: 0, unit: '%' },
    },
    {
      id: generateUniqueId(),
      color: '#60a5fa',
      position: { value: 100, unit: '%' },
    },
  ];
}

function createDefaultGradientParts() {
  return {
    source: 'build',
    kind: 'linear',
    angle: { value: 90, unit: 'deg' },
    shape: 'ellipse',
    position: 'center center',
    stops: createDefaultStops(),
    presetSlug: '',
    raw: '',
  };
}

function isGradientString(value) {
  if (typeof value !== 'string') return false;
  return /(?:repeating-)?(?:linear|radial|conic)-gradient\(/i.test(value) || PRESET_GRADIENT_VAR_REGEX.test(value);
}

function extractStoredValue(entry) {
  if (!entry) return '';
  if (typeof entry === 'object') return entry.value || '';
  return entry;
}

function resolveDisplayedGradientValue(value, gradients = []) {
  if (typeof value !== 'string' || !value) return value || '';

  const match = value.match(PRESET_GRADIENT_VAR_REGEX);
  if (!match) return value;

  return gradients.find(({ slug }) => slug === match[1])?.gradient || value;
}

function getPresetKey(gradient, index = 0) {
  if (gradient?.slug) return `slug:${gradient.slug}`;
  if (gradient?.gradient) return `css:${gradient.gradient}`;
  return `index:${index}`;
}

function findPresetByKey(gradients = [], key = '') {
  if (!key) return null;
  return gradients.find((gradient, index) => getPresetKey(gradient, index) === key) || null;
}

function findPresetMetadata(gradients = [], entry) {
  if (!entry) return null;

  const value = typeof entry === 'object' ? extractStoredValue(entry) : String(entry);
  const presetKey = typeof entry === 'object' ? entry.presetKey || '' : '';
  const presetSlug = typeof entry === 'object' ? entry.presetSlug || '' : '';
  const presetCss = typeof entry === 'object' ? entry.presetCss || '' : '';

  if (presetKey) {
    const matchedByKey = findPresetByKey(gradients, presetKey);
    if (matchedByKey) return { preset: matchedByKey, presetKey };
  }

  if (presetSlug) {
    const matchedBySlug = gradients.find((gradient) => gradient?.slug === presetSlug);
    if (matchedBySlug) {
      return { preset: matchedBySlug, presetKey: getPresetKey(matchedBySlug, gradients.indexOf(matchedBySlug)) };
    }
  }

  if (presetCss) {
    const matchedByCss = gradients.find((gradient) => gradient?.gradient === presetCss);
    if (matchedByCss) {
      return { preset: matchedByCss, presetKey: getPresetKey(matchedByCss, gradients.indexOf(matchedByCss)) };
    }
  }

  const presetMatch = value.match(PRESET_GRADIENT_VAR_REGEX);
  if (presetMatch) {
    const matchedByVar = gradients.find((gradient) => gradient?.slug === presetMatch[1]);
    if (matchedByVar) {
      return { preset: matchedByVar, presetKey: getPresetKey(matchedByVar, gradients.indexOf(matchedByVar)) };
    }
  }

  const matchedByValue = gradients.find((gradient) => gradient?.gradient === value);
  if (matchedByValue) {
    return { preset: matchedByValue, presetKey: getPresetKey(matchedByValue, gradients.indexOf(matchedByValue)) };
  }

  return null;
}

function formatConfigUnit(config, fallback = '') {
  if (!config || config.value === undefined || config.value === null || config.value === '') {
    return fallback;
  }

  if (config.unit === 'custom' || config.unit === 'unitless' || config.unit === 'keyword') {
    return String(config.value);
  }

  return `${config.value}${config.unit || ''}`;
}

function normalizeStop(stop, index) {
  const fallbackPosition = index === 0 ? 0 : 100;

  return {
    id: stop?.id || generateUniqueId(),
    color: stop?.color || '#000000',
    position: stop?.position && typeof stop.position === 'object'
      ? {
          value: stop.position.value ?? fallbackPosition,
          unit: stop.position.unit || '%',
        }
      : { value: fallbackPosition, unit: '%' },
  };
}

function normalizeStops(stops = []) {
  return stops.map((stop, index) => normalizeStop(stop, index));
}

function getStopPositionValue(stop, fallback = 0) {
  return Number(stop?.position?.value ?? fallback);
}

function getStopBounds(stops = [], index) {
  const min = index > 0 ? getStopPositionValue(stops[index - 1], 0) : 0;
  const max = index < stops.length - 1 ? getStopPositionValue(stops[index + 1], 100) : 100;

  return { min, max };
}

function assembleGradient(parts = {}) {
  const kind = parts.kind || 'linear';
  const stops = normalizeStops(parts.stops || []).filter((stop) => stop.color);
  if (stops.length < 2) return null;

  const stopString = stops
    .map((stop) => {
      const position = formatConfigUnit(stop.position);
      return position ? `${stop.color} ${position}` : stop.color;
    })
    .join(', ');

  if (kind === 'radial') {
    const descriptorParts = [];
    if (parts.shape) descriptorParts.push(parts.shape);
    if (parts.position) descriptorParts.push(`at ${parts.position}`);
    const descriptor = descriptorParts.join(' ');

    return descriptor
      ? `radial-gradient(${descriptor}, ${stopString})`
      : `radial-gradient(${stopString})`;
  }

  const angle = formatConfigUnit(parts.angle, '90deg');
  return `linear-gradient(${angle}, ${stopString})`;
}

function buildGradientValue(parts) {
  const { value: _prevValue, unit: _prevUnit, ...restParts } = parts || {};
  const css = parts.source === 'custom'
    ? parts.raw || ''
    : parts.source === 'preset'
    ? parts.presetCss || (parts.presetSlug ? `var(--wp--preset--gradient--${parts.presetSlug})` : '')
    : assembleGradient(parts);

  if (!css) return null;

  return {
    ...restParts,
    value: css,
    unit: 'custom',
  };
}

function getEditableGradient(entry, gradients = []) {
  const defaults = createDefaultGradientParts();
  if (!entry) return defaults;

  if (typeof entry === 'object') {
    const value = extractStoredValue(entry);
    const presetMatch = value.match(PRESET_GRADIENT_VAR_REGEX);
    const presetMetadata = findPresetMetadata(gradients, entry);

    return {
      ...defaults,
      ...entry,
      source: entry.source || (presetMatch ? 'preset' : isGradientString(value) ? 'custom' : 'build'),
      presetSlug: presetMetadata?.preset?.slug || entry.presetSlug || presetMatch?.[1] || '',
      presetKey: presetMetadata?.presetKey || entry.presetKey || '',
      presetCss: presetMetadata?.preset?.gradient || entry.presetCss || '',
      raw: entry.raw || (entry.source === 'custom' ? value : ''),
      stops: Array.isArray(entry.stops) && entry.stops.length > 0 ? normalizeStops(entry.stops) : defaults.stops,
      angle: entry.angle && typeof entry.angle === 'object' ? {
        value: entry.angle.value ?? defaults.angle.value,
        unit: entry.angle.unit || defaults.angle.unit,
      } : defaults.angle,
      shape: entry.shape || defaults.shape,
      position: entry.position || defaults.position,
    };
  }

  const presetMatch = String(entry).match(PRESET_GRADIENT_VAR_REGEX);
  if (presetMatch) {
    const presetMetadata = findPresetMetadata(gradients, entry);
    return {
      ...defaults,
      source: 'preset',
      presetSlug: presetMetadata?.preset?.slug || presetMatch[1],
      presetKey: presetMetadata?.presetKey || '',
      presetCss: presetMetadata?.preset?.gradient || '',
    };
  }

  const presetMetadata = findPresetMetadata(gradients, entry);
  if (presetMetadata) {
    return {
      ...defaults,
      source: 'preset',
      presetSlug: presetMetadata.preset?.slug || '',
      presetKey: presetMetadata.presetKey,
      presetCss: presetMetadata.preset?.gradient || '',
    };
  }

  if (isGradientString(entry)) {
    return {
      ...defaults,
      source: 'custom',
      raw: String(entry),
    };
  }

  return defaults;
}

function getPresetOptions(gradients = []) {
  return [
    { label: 'Select preset', value: '' },
    ...gradients.map((gradient, index) => ({
      label: gradient.name || gradient.slug || gradient.gradient,
      value: getPresetKey(gradient, index),
    })),
  ];
}

export default function GradientControls({
  customStyle = {},
  updateCustomStyle,
  property = 'backgroundImage',
  label = 'Background Gradient',
  usePanelBody = true,
}) {
  const [themeGradients = []] = useSettings('color.gradients');
  const currentEntry = customStyle[property] || null;
  const currentValue = extractStoredValue(currentEntry);
  const currentDisplayValue = resolveDisplayedGradientValue(currentValue, themeGradients);
  const currentGradient = useMemo(
    () => getEditableGradient(currentEntry, themeGradients),
    [currentEntry, themeGradients]
  );
  const [customCssDraft, setCustomCssDraft] = useState(currentGradient.raw || currentDisplayValue || '');
  const isModified = hasModifiedStyleProps(customStyle, [property]);
  const presetOptions = useMemo(() => getPresetOptions(themeGradients), [themeGradients]);

  useEffect(() => {
    setCustomCssDraft(currentGradient.raw || currentDisplayValue || '');
  }, [currentGradient.raw, currentDisplayValue]);

  const persistGradient = (parts) => {
    const nextValue = buildGradientValue(parts);
    updateCustomStyle(property, nextValue);
  };

  const updateGradientParts = (patch) => {
    const nextParts = {
      ...currentGradient,
      ...patch,
      source: 'build',
      presetSlug: '',
      raw: '',
    };

    persistGradient(nextParts);
  };

  const updateStop = (stopId, stopPatch) => {
    const currentStops = normalizeStops(currentGradient.stops || []);
    const stopIndex = currentStops.findIndex((stop) => stop.id === stopId);
    if (stopIndex < 0) return;

    const nextStops = currentStops.map((stop, index) => {
      if (index !== stopIndex) return stop;

      if (stopPatch.position && typeof stopPatch.position === 'object') {
        const { min, max } = getStopBounds(currentStops, stopIndex);
        const nextValue = Math.min(
          max,
          Math.max(min, Number(stopPatch.position.value ?? getStopPositionValue(stop, min)))
        );

        return {
          ...stop,
          ...stopPatch,
          position: {
            ...stop.position,
            ...stopPatch.position,
            value: nextValue,
          },
        };
      }

      return { ...stop, ...stopPatch };
    });

    updateGradientParts({ stops: nextStops });
  };

  const addStop = () => {
    const currentStops = normalizeStops(currentGradient.stops || []);
    const lastStop = currentStops[currentStops.length - 1];
    const previousStop = currentStops[currentStops.length - 2];
    const nextPosition = lastStop
      ? Math.min(
          100,
          previousStop
            ? Math.round((Number(previousStop.position?.value ?? 0) + Number(lastStop.position?.value ?? 100)) / 2)
            : Math.round((Number(lastStop.position?.value ?? 0) + 100) / 2)
        )
      : 50;

    updateGradientParts({
      stops: [
        ...currentStops,
        {
          id: generateUniqueId(),
          color: lastStop?.color || '#ffffff',
          position: { value: nextPosition, unit: '%' },
        },
      ],
    });
  };

  const removeStop = (stopId) => {
    const nextStops = (currentGradient.stops || []).filter((stop) => stop.id !== stopId);
    if (nextStops.length < 2) return;
    updateGradientParts({ stops: nextStops });
  };

  const moveStop = (stopId, direction) => {
    const currentStops = normalizeStops(currentGradient.stops || []);
    const stopIndex = currentStops.findIndex((stop) => stop.id === stopId);
    const targetIndex = stopIndex + direction;

    if (stopIndex < 0 || targetIndex < 0 || targetIndex >= currentStops.length) return;

    const currentStop = currentStops[stopIndex];
    const targetStop = currentStops[targetIndex];
    const nextStops = [...currentStops];

    nextStops[stopIndex] = {
      ...targetStop,
      position: currentStop.position,
    };
    nextStops[targetIndex] = {
      ...currentStop,
      position: targetStop.position,
    };

    updateGradientParts({ stops: nextStops });
  };

  const reverseStops = () => {
    const nextStops = [...normalizeStops(currentGradient.stops || [])]
      .reverse()
      .map((stop) => ({
        ...stop,
        position: { value: 100 - Number(stop.position?.value ?? 0), unit: stop.position?.unit || '%' },
      }));

    updateGradientParts({ stops: nextStops });
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === 'preset') {
      const firstPreset = themeGradients[0];
      if (!firstPreset?.gradient) return;
      persistGradient({
        ...currentGradient,
        source: 'preset',
        presetSlug: firstPreset.slug || '',
        presetKey: getPresetKey(firstPreset, 0),
        presetCss: firstPreset.gradient,
        raw: '',
      });
      return;
    }

    if (nextMode === 'custom') {
      persistGradient({
        ...currentGradient,
        source: 'custom',
        raw: customCssDraft || currentDisplayValue || '',
        presetSlug: '',
        presetKey: '',
        presetCss: '',
      });
      return;
    }

    updateGradientParts({
      stops: currentGradient.stops?.length >= 2 ? currentGradient.stops : createDefaultStops(),
    });
  };

  const handlePresetChange = (presetKey) => {
    if (!presetKey) {
      updateCustomStyle(property, null);
      return;
    }

    const preset = findPresetByKey(themeGradients, presetKey);
    if (!preset?.gradient) return;

    persistGradient({
      ...currentGradient,
      source: 'preset',
      presetSlug: preset.slug || '',
      presetKey,
      presetCss: preset.gradient,
      raw: '',
    });
  };

  const handleApplyCustomCss = () => {
    const nextRawValue = customCssDraft.trim();
    updateCustomStyle(
      property,
      nextRawValue
        ? buildGradientValue({
            ...currentGradient,
            source: 'custom',
            raw: nextRawValue,
            presetSlug: '',
            presetKey: '',
            presetCss: '',
          })
        : null
    );
  };

  const controls = (
    <div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '64px',
          borderRadius: '4px',
          border: '1px solid rgba(0,0,0,0.1)',
          marginBottom: '8px',
          overflow: 'hidden',
          backgroundImage: CHECKERBOARD,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: currentDisplayValue || 'none',
          }}
        />
      </div>

      <p
        style={{
          fontSize: '12px',
          color: 'var(--tmsblocks-text-muted, #4a5a5a)',
          marginBottom: '12px',
          fontFamily: currentValue ? 'monospace' : 'inherit',
          wordBreak: 'break-word',
        }}
      >
        {currentValue || 'No gradient selected'}
      </p>

      <SelectControl
        label="Mode"
        value={currentGradient.source || 'build'}
        options={MODE_OPTIONS}
        onChange={handleModeChange}
      />

      {(currentGradient.source || 'build') === 'build' && (
        <>
          <SelectControl
            label="Type"
            value={currentGradient.kind || 'linear'}
            options={TYPE_OPTIONS}
            onChange={(value) => updateGradientParts({ kind: value })}
          />

          {(currentGradient.kind || 'linear') === 'linear' ? (
            <RangeControl
              label="Angle"
              value={Number(currentGradient.angle?.value ?? 90)}
              min={0}
              max={360}
              onChange={(value) => updateGradientParts({ angle: { value, unit: 'deg' } })}
            />
          ) : (
            <>
              <SelectControl
                label="Shape"
                value={currentGradient.shape || 'ellipse'}
                options={RADIAL_SHAPE_OPTIONS}
                onChange={(value) => updateGradientParts({ shape: value })}
              />
              <TextControl
                label="Origin"
                value={currentGradient.position || ''}
                onChange={(value) => updateGradientParts({ position: value || 'center center' })}
                placeholder="center center"
              />
            </>
          )}

          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            <Flex justify="space-between" align="center">
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Color Stops</span>
              <Flex gap={2}>
                <Button isSmall variant="secondary" onClick={addStop}>
                  Add stop
                </Button>
                <Button isSmall variant="tertiary" onClick={reverseStops}>
                  Reverse
                </Button>
              </Flex>
            </Flex>
          </div>

          {(currentGradient.stops || []).map((stop, index) => (
            (() => {
              const stopList = currentGradient.stops || [];
              const { min, max } = getStopBounds(stopList, index);

              return (
            <div
              key={stop.id}
              style={{
                padding: '8px',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '4px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.55)',
              }}
            >
              <Flex justify="space-between" align="center" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Stop {index + 1}
                </span>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
                  <Button
                    isSmall
                    variant="tertiary"
                    onClick={() => moveStop(stop.id, -1)}
                    disabled={index === 0}
                    aria-label={`Move stop ${index + 1} up`}
                    title="Move up"
                    style={{ minWidth: '28px', padding: '0 6px', fontSize: '16px', lineHeight: 1 }}
                  >
                    ▴
                  </Button>
                  <Button
                    isSmall
                    variant="tertiary"
                    onClick={() => moveStop(stop.id, 1)}
                    disabled={index === (currentGradient.stops || []).length - 1}
                    aria-label={`Move stop ${index + 1} down`}
                    title="Move down"
                    style={{ minWidth: '28px', padding: '0 6px', fontSize: '16px', lineHeight: 1 }}
                  >
                    ▾
                  </Button>
                  <Button
                    isSmall
                    isDestructive
                    variant="tertiary"
                    onClick={() => removeStop(stop.id)}
                    disabled={(currentGradient.stops || []).length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              </Flex>

              <div style={{ marginBottom: '6px' }}>
                <ColorControls
                  customStyle={{ stopColor: stop.color }}
                  updateCustomStyle={(prop, value) => updateStop(stop.id, { color: value || null })}
                  property="stopColor"
                  label="Color"
                  variant="button"
                  usePanelBody={false}
                  clearAsIcon
                />
              </div>

              <RangeControl
                label="Position"
                value={Number(stop.position?.value ?? 0)}
                min={min}
                max={max}
                onChange={(value) => updateStop(stop.id, { position: { value, unit: '%' } })}
                help={`Allowed range: ${min}% to ${max}%`}
              />
            </div>
              );
            })()
          ))}
        </>
      )}

      {(currentGradient.source || 'build') === 'preset' && (
        <>
          <SelectControl
            label="Theme Gradient"
            value={currentGradient.presetKey || ''}
            options={presetOptions}
            onChange={handlePresetChange}
            help={themeGradients.length === 0 ? 'No theme gradients available.' : undefined}
          />
          {(currentGradient.presetKey || currentGradient.presetSlug) && (
            <Button isSmall variant="secondary" onClick={() => handleModeChange('build')}>
              Switch to Builder
            </Button>
          )}
        </>
      )}

      {(currentGradient.source || 'build') === 'custom' && (
        <>
          <TextareaControl
            label="Gradient CSS"
            value={customCssDraft}
            onChange={setCustomCssDraft}
            help="Enter a CSS gradient value such as linear-gradient(90deg, #000 0%, #fff 100%)."
          />
          <Flex justify="flex-start" gap={2}>
            <Button isSmall variant="secondary" onClick={handleApplyCustomCss}>
              Apply CSS
            </Button>
            {currentGradient.raw && (
              <Button isSmall variant="tertiary" onClick={() => setCustomCssDraft(currentGradient.raw)}>
                Reset draft
              </Button>
            )}
          </Flex>
        </>
      )}
    </div>
  );

  if (!usePanelBody) return controls;

  return (
    <PanelBody title={<PanelTitle title={label} isModified={isModified} />} initialOpen={false}>
      {controls}
    </PanelBody>
  );
}
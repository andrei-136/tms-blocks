/**
 * TRANSITION CONTROLS
 *
 * Manages the CSS `transition` property with two modes:
 *
 * AUTO-SYNC: property list is derived from all state styles combined
 *            (hover, focusVisible, etc.). Adding/removing a state style
 *            automatically adds/removes its transition row.
 *
 * MANUAL:    property list is frozen and managed manually.
 *            State style changes have no effect on the list.
 *
 * In both modes:
 *   - Global duration/easing/delay apply to all properties
 *   - Individual rows can be expanded to override global values
 *
 * Data shape (stored as `transitionConfig` attribute, separate from customStyle):
 * {
 *   linked: true,
 *   global: { duration: '0.2', durationUnit: 's', easing: 'ease', easingCustom: '', delay: '0', delayUnit: 's' },
 *   overrides: { color: { duration, durationUnit, easing, easingCustom, delay, delayUnit } },
 *   unlinkedProperties: [],
 * }
 *
 * The serialized `transition` CSS string is written to customStyle.transition.
 *
 * Props:
 *   customStyle         {Object}   - base customStyle (for writing transition string)
 *   updateCustomStyle   {Function} - updater for customStyle
 *   stateStyles         {Object}   - map of state name -> customStyle object
 *                                    e.g. { hover: customStyleHover, focusVisible: customStyleFocusVisible }
 *   transitionConfig    {Object}   - the transitionConfig attribute
 *   setTransitionConfig {Function} - (nextConfig) => setAttributes({ transitionConfig: nextConfig })
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  PanelBody,
  Button,
  SelectControl,
  TextControl,
  Flex,
  FlexItem,
  ToggleControl,
} from '@wordpress/components';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { getModificationLevel, isStylePropSet } from '../style-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASING_OPTIONS = [
  { label: 'ease',         value: 'ease'        },
  { label: 'ease-in',      value: 'ease-in'     },
  { label: 'ease-out',     value: 'ease-out'    },
  { label: 'ease-in-out',  value: 'ease-in-out' },
  { label: 'linear',       value: 'linear'      },
  { label: 'step-start',   value: 'step-start'  },
  { label: 'step-end',     value: 'step-end'    },
  { label: 'Custom...',      value: '__custom__'  },
];

const DURATION_UNIT_OPTIONS = [
  { label: 'ms', value: 'ms' },
  { label: 's',  value: 's'  },
];

const KNOWN_EASINGS = new Set(
  EASING_OPTIONS.map((o) => o.value).filter((v) => v !== '__custom__')
);

export const DEFAULT_GLOBAL = {
  duration:     '0.2',
  durationUnit: 's',
  easing:       'ease',
  easingCustom: '',
  delay:        '0',
  delayUnit:    's',
};

const DEFAULT_CONFIG = {
  linked:             false, // Default: auto-sync OFF
  global:             { ...DEFAULT_GLOBAL },
  overrides:          {},
  unlinkedProperties: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** camelCase -> kebab-case */
function toKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/** Collect active CSS property names from a stateStyle object. */
function propertiesFromStateStyle(stateStyle = {}) {
  return Object.entries(stateStyle)
    .filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string')  return v.trim() !== '' && v !== 'default';
      if (typeof v === 'object') {
        if (Object.prototype.hasOwnProperty.call(v, 'value')) {
          return typeof v.value === 'string'
            ? v.value.trim() !== ''
            : v.value !== null && v.value !== undefined;
        }
        return Object.keys(v).length > 0;
      }
      return true;
    })
    .map(([k]) => toKebab(k));
}

/** Collect deduplicated properties across all state styles. */
function propertiesFromAllStates(stateStyles = {}) {
  const seen = new Set();
  const result = [];
  Object.values(stateStyles).forEach((stateStyle) => {
    propertiesFromStateStyle(stateStyle).forEach((p) => {
      if (!seen.has(p)) { seen.add(p); result.push(p); }
    });
  });
  return result;
}

/** Serialize one transition entry. */
function serializeEntry(property, timing) {
  const easing = timing.easing === '__custom__'
    ? timing.easingCustom || 'ease'
    : timing.easing || 'ease';
  return `${property} ${timing.duration || '0.2'}${timing.durationUnit || 's'} ${easing} ${timing.delay || '0'}${timing.delayUnit || 's'}`;
}

/** Build full transition CSS string. */
export function buildTransitionString(config, activeProperties) {
  if (!activeProperties.length) return null;
  const { global: g = DEFAULT_GLOBAL, overrides = {} } = config;
  return activeProperties
    .map((prop) => serializeEntry(prop, overrides[prop] ? { ...g, ...overrides[prop] } : g))
    .join(', ');
}

/** Derive the active property list based on linked/manual mode. */
export function deriveActiveProperties(config, stateStyles) {
  return config.linked
    ? propertiesFromAllStates(stateStyles)
    : config.unlinkedProperties || [];
}

// ---------------------------------------------------------------------------
// Inline style constants
// ---------------------------------------------------------------------------

const labelStyle = {
  fontSize:      '11px',
  fontWeight:    600,
  textTransform: 'uppercase',
  display:       'block',
  marginBottom:  '4px',
};

const rowStyle = {
  border:          '1px solid var(--tmsblocks-border, #d6d0f0)',
  borderRadius:    '4px',
  padding:         '8px 10px',
  marginBottom:    '6px',
  backgroundColor: 'white',
};

// ---------------------------------------------------------------------------
// TimingFields
// ---------------------------------------------------------------------------

function TimingFields({ values, onChange, isGlobal = false }) {
  const resolvedEasing = KNOWN_EASINGS.has(values.easing) ? values.easing : '__custom__';

  return (
    <div>
      <Flex align="flex-start" gap={2} style={{ marginBottom: '8px' }}>
        {/* Duration */}
        <FlexItem style={{ flex: 1 }}>
          <span style={labelStyle}>
            <ControlLabel
              label="Duration"
              isSet={!isGlobal && (
                values.duration     !== DEFAULT_GLOBAL.duration ||
                values.durationUnit !== DEFAULT_GLOBAL.durationUnit
              )}
            />
          </span>
          <Flex align="center" gap={1}>
            <FlexItem style={{ flex: 1, minWidth: '50px' }}>
              <TextControl
                type="number"
                value={values.duration}
                min={0}
                step={0.05}
                onChange={(v) => onChange({ ...values, duration: v })}
                __nextHasNoMarginBottom
              />
            </FlexItem>
            <FlexItem>
              <SelectControl
                value={values.durationUnit}
                options={DURATION_UNIT_OPTIONS}
                onChange={(v) => onChange({ ...values, durationUnit: v })}
                __nextHasNoMarginBottom
              />
            </FlexItem>
          </Flex>
        </FlexItem>

        {/* Delay */}
        <FlexItem style={{ flex: 1 }}>
          <span style={labelStyle}>
            <ControlLabel
              label="Delay"
              isSet={!isGlobal && values.delay !== DEFAULT_GLOBAL.delay}
            />
          </span>
          <Flex align="center" gap={1}>
            <FlexItem style={{ flex: 1, minWidth: '50px' }}>
              <TextControl
                type="number"
                value={values.delay}
                min={0}
                step={0.05}
                onChange={(v) => onChange({ ...values, delay: v })}
                __nextHasNoMarginBottom
              />
            </FlexItem>
            <FlexItem>
              <SelectControl
                value={values.delayUnit}
                options={DURATION_UNIT_OPTIONS}
                onChange={(v) => onChange({ ...values, delayUnit: v })}
                __nextHasNoMarginBottom
              />
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>

      {/* Easing */}
      <SelectControl
        label={
          <ControlLabel
            label="Easing"
            isSet={!isGlobal && values.easing !== DEFAULT_GLOBAL.easing}
          />
        }
        value={resolvedEasing}
        options={EASING_OPTIONS}
        onChange={(v) => onChange({ ...values, easing: v, easingCustom: '' })}
        __nextHasNoMarginBottom
      />
      {resolvedEasing === '__custom__' && (
        <TextControl
          placeholder="e.g. cubic-bezier(0.4, 0, 0.2, 1)"
          value={values.easingCustom || ''}
          onChange={(v) => onChange({ ...values, easingCustom: v })}
          style={{ marginTop: '4px' }}
          __nextHasNoMarginBottom
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertyRow
// ---------------------------------------------------------------------------

function PropertyRow({ property, globalTiming, override, onOverrideChange, onOverrideClear, isLinked, onRemove, masterOverride }) {
  const [expanded, setExpanded] = useState(false);
  const hasOverride    = !!override;
  const displayValues  = hasOverride ? { ...globalTiming, ...override } : globalTiming;

  // Dot level for the override indicator
  const overrideLevel = (() => {
    if (!hasOverride) return 0;
    if (masterOverride === undefined) return 1; // blue – no master for comparison
    try {
      return JSON.stringify(override) === JSON.stringify(masterOverride) ? 2 : 3;
    } catch { return 1; }
  })();

  const summary = (() => {
    const easing = displayValues.easing === '__custom__'
      ? displayValues.easingCustom || 'ease'
      : displayValues.easing;
    return `${displayValues.duration}${displayValues.durationUnit} ${easing} ${displayValues.delay}${displayValues.delayUnit}`;
  })();

  return (
    <div style={rowStyle}>
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={1}>
          <code style={{ fontSize: '11px', fontWeight: 700, color: '#1e1e1e' }}>
            {property}
          </code>
          {hasOverride && overrideLevel > 0 && (
            <span style={{
              width: '5px', height: '5px', borderRadius: '999px',
              backgroundColor: overrideLevel >= 3 ? '#f5a623' : overrideLevel >= 2 ? '#a855f7' : 'var(--wp-admin-theme-color, #007cba)',
              display: 'inline-block', flexShrink: 0,
            }} />
          )}
        </Flex>

        <Flex align="center" gap={1}>
          <Button
            isSmall
            variant="tertiary"
            onClick={() => {
              if (hasOverride) { onOverrideClear(property); setExpanded(false); }
              else             { onOverrideChange(property, { ...globalTiming }); setExpanded(true); }
            }}
            style={{ fontSize: '11px' }}
          >
            {hasOverride ? 'Reset' : 'Override'}
          </Button>

          {hasOverride && (
            <Button
              isSmall
              variant="tertiary"
              onClick={() => setExpanded((v) => !v)}
              style={{ fontSize: '11px' }}
              aria-label={expanded ? 'Collapse override' : 'Expand override'}
            >
              {expanded ? 'Hide' : 'Show'}
            </Button>
          )}

          {!isLinked && (
            <Button
              isSmall
              isDestructive
              variant="tertiary"
              onClick={onRemove}
              aria-label={`Remove ${property}`}
            >
              Remove
            </Button>
          )}
        </Flex>
      </Flex>

      <span style={{ fontSize: '11px', color: 'var(--tmsblocks-text-muted, #4a5a5a)', display: 'block', marginTop: '2px' }}>
        {summary}{hasOverride && ' (overridden)'}
      </span>

      {expanded && hasOverride && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--tmsblocks-border, #d6d0f0)' }}>
          <TimingFields
            values={displayValues}
            onChange={(next) => onOverrideChange(property, next)}
            isGlobal={false}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ManualPropertyAdder
// ---------------------------------------------------------------------------

function ManualPropertyAdder({ activeProperties, onAdd }) {
  const [property, setProperty] = useState('');
  const isDuplicate = activeProperties.includes(property.trim());

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--tmsblocks-border, #d6d0f0)' }}>
      <span style={{ ...labelStyle, marginBottom: '6px' }}>Add CSS property</span>
      <Flex align="flex-end" gap={2}>
        <FlexItem style={{ flex: 1 }}>
          <TextControl
            label={null}
            placeholder="e.g. border-radius"
            value={property}
            onChange={setProperty}
            __nextHasNoMarginBottom
          />
        </FlexItem>
        <FlexItem>
          <Button
            variant="secondary"
            isSmall
            disabled={!property.trim() || isDuplicate}
            onClick={() => { onAdd(property.trim()); setProperty(''); }}
          >
            Add
          </Button>
        </FlexItem>
      </Flex>
      {isDuplicate && property && (
        <p style={{ fontSize: '11px', color: '#c0392b', marginTop: '4px' }}>
          Property already in list.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TransitionControls({
  customStyle       = {},
  updateCustomStyle,
  stateStyles       = {},
  transitionConfig  = {},
  setTransitionConfig = () => {},
  masterTransitionConfig = null,
}) {
  const config = useMemo(() => ({
    linked:             transitionConfig.linked             ?? DEFAULT_CONFIG.linked,
    global:             { ...DEFAULT_GLOBAL, ...(transitionConfig.global || {}) },
    overrides:          transitionConfig.overrides          || {},
    unlinkedProperties: transitionConfig.unlinkedProperties || [],
  }), [transitionConfig]);

  const activeProperties = useMemo(
    () => deriveActiveProperties(config, stateStyles),
    [config, stateStyles]
  );

  const isModified = activeProperties.length > 0;

  // Compare transitionConfig against master for dot colours
  const transitionLevel = useMemo(() => {
    if (activeProperties.length === 0) return 0;
    if (!masterTransitionConfig) return 1; // blue – standalone
    try {
      const ours = JSON.stringify(transitionConfig);
      const theirs = JSON.stringify(masterTransitionConfig);
      return ours === theirs ? 2 : 3; // purple / orange
    } catch { return 1; }
  }, [activeProperties.length, masterTransitionConfig, transitionConfig]);

  const clearLabel = masterTransitionConfig ? 'Reset' : 'Clear';

  // Keep transition string in sync
  useEffect(() => {
    const nextTransition = buildTransitionString(config, activeProperties) || null;
    const currentTransition = customStyle.transition || null;
    if (nextTransition !== currentTransition) {
      updateCustomStyle('transition', nextTransition);
    }
  }, [activeProperties, config, customStyle.transition, updateCustomStyle]);

  // Commit

  const commit = (nextConfig, nextProperties) => {
    setTransitionConfig(nextConfig);
    updateCustomStyle('transition', buildTransitionString(nextConfig, nextProperties) || null);
  };

  // Handlers

  const handleGlobalChange = (nextGlobal) => {
    const nextOverrides = { ...config.overrides };
    Object.keys(nextOverrides).forEach((prop) => {
      const o = nextOverrides[prop];
      const same =
        o.duration     === nextGlobal.duration     &&
        o.durationUnit === nextGlobal.durationUnit &&
        o.easing       === nextGlobal.easing       &&
        (o.easingCustom || '') === (nextGlobal.easingCustom || '') &&
        o.delay        === nextGlobal.delay        &&
        o.delayUnit    === nextGlobal.delayUnit;
      if (same) delete nextOverrides[prop];
    });
    commit({ ...config, global: nextGlobal, overrides: nextOverrides }, activeProperties);
  };

  const handleOverrideChange = (property, values) => {
    commit({ ...config, overrides: { ...config.overrides, [property]: values } }, activeProperties);
  };

  const handleOverrideClear = (property) => {
    const nextOverrides = { ...config.overrides };
    delete nextOverrides[property];
    commit({ ...config, overrides: nextOverrides }, activeProperties);
  };

  const handleLinkedToggle = (linked) => {
    // Switching to manual: snapshot current live properties as the frozen list
    const unlinkedProperties = linked ? [] : propertiesFromAllStates(stateStyles);
    const next = { ...config, linked, unlinkedProperties };
    const nextActive = deriveActiveProperties(next, stateStyles);

    // Clean overrides for properties no longer active
    const nextOverrides = { ...config.overrides };
    Object.keys(nextOverrides).forEach((p) => {
      if (!nextActive.includes(p)) delete nextOverrides[p];
    });

    commit({ ...next, overrides: nextOverrides }, nextActive);
  };

  const handleAddProperty = (property) => {
    if (!property || activeProperties.includes(property)) return;
    const next = { ...config, unlinkedProperties: [...config.unlinkedProperties, property] };
    commit(next, deriveActiveProperties(next, stateStyles));
  };

  const handleRemoveProperty = (property) => {
    const nextOverrides = { ...config.overrides };
    delete nextOverrides[property];
    const next = {
      ...config,
      overrides:          nextOverrides,
      unlinkedProperties: config.unlinkedProperties.filter((p) => p !== property),
    };
    commit(next, deriveActiveProperties(next, stateStyles));
  };

  const handleClear = () => {
    if (masterTransitionConfig) {
      setTransitionConfig(masterTransitionConfig);
    } else {
      const next = { ...DEFAULT_CONFIG };
      setTransitionConfig(next);
      updateCustomStyle('transition', null);
    }
  };

  // Render

  return (
    <PanelBody
      title={<PanelTitle title="Transition" level={transitionLevel} />}
      initialOpen={false}
    >
      {/* Auto-sync toggle */}
      <ToggleControl
        label="Auto-sync properties"
        checked={config.linked}
        onChange={handleLinkedToggle}
        help={
          config.linked
            ? 'Property list follows state styles automatically'
            : 'Property list is managed manually'
        }
        __nextHasNoMarginBottom
      />

      {/* Global timing */}
      {activeProperties.length > 0 && (
        <div style={{
          ...rowStyle,
          backgroundColor: 'var(--tmsblocks-cold-white, #eeebf9)',
          marginBottom:    '12px',
          marginTop:       '12px',
        }}>
          <span style={{ ...labelStyle, marginBottom: '10px' }}>Global timing</span>
          <TimingFields
            values={config.global}
            onChange={handleGlobalChange}
            isGlobal
          />
        </div>
      )}

      {/* Property rows */}
      {activeProperties.length > 0 ? (
        <>
          <span style={{ ...labelStyle, marginBottom: '6px', color: 'var(--tmsblocks-text-muted, #4a5a5a)' }}>
            <ControlLabel label="Properties" level={transitionLevel} />
          </span>
          {activeProperties.map((prop) => (
            <PropertyRow
              key={prop}
              property={prop}
              globalTiming={config.global}
              override={config.overrides[prop] || null}
              onOverrideChange={handleOverrideChange}
              onOverrideClear={handleOverrideClear}
              isLinked={config.linked}
              onRemove={() => handleRemoveProperty(prop)}
              masterOverride={masterTransitionConfig?.overrides?.[prop]}
            />
          ))}
        </>
      ) : (
        <p style={{ fontSize: '12px', color: 'var(--tmsblocks-text-muted, #4a5a5a)', fontStyle: 'italic', marginTop: '8px' }}>
          {config.linked
            ? 'No state styles set yet. Add hover or focus-visible styles to see transitions here.'
            : 'No properties added yet.'}
        </p>
      )}

      {/* Manual property adder */}
      {!config.linked && (
        <ManualPropertyAdder
          activeProperties={activeProperties}
          onAdd={handleAddProperty}
        />
      )}

      {/* Clear all */}
      {transitionLevel > 0 && (
        <Button
          variant="tertiary"
          isSmall
          isDestructive
          onClick={handleClear}
          style={{ marginTop: '12px' }}
        >
          {`${clearLabel} all transition overrides`}
        </Button>
      )}

      <p style={{
        marginTop:   '10px',
        fontSize:    '11px',
        fontStyle:   'italic',
        color:       'var(--tmsblocks-text-muted, #4a5a5a)',
        borderLeft:  '3px solid var(--tmsblocks-accent, #FFC928)',
        paddingLeft: '8px',
      }}>
        Transition is always set on the base element and applies to all states.
      </p>
    </PanelBody>
  );
}

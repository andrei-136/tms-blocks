import { resolveBreakpoints } from './breakpoints';

const KEYWORD_STYLE_UNITS = new Set([
  'keyword',
  'auto',
  'none',
  'inherit',
  'initial',
  'unset',
  'revert',
  'normal',
  'fit-content',
  'min-content',
  'max-content',
  'content',
]);

// Add new properties that might come from Grid, etc.
export const customStyleToInlineStyle = (customStyle = {}) => {
  const style = {};
  
  Object.entries(customStyle).forEach(([prop, value]) => {
    if (!value) return;

    // If it's an object with { value, unit }
    if (typeof value === 'object' && value.value !== undefined) {
      const { value: numValue, unit } = value;
      if (numValue === '' || numValue === null || numValue === undefined) return;

      if (unit === 'size-presets') {
        style[prop] = `var(--wp--preset--spacing--${numValue})`;
      } else if (unit === 'layout-presets') {
        if (numValue === 'content') {
          style[prop] = 'var(--wp--style--global--content-size)';
        } else if (numValue === 'wide') {
          style[prop] = 'var(--wp--style--global--wide-size)';
        }
      } else if (unit === 'font-size-presets') {
        style[prop] = `var(--wp--preset--font-size--${numValue})`;
      } else if (KEYWORD_STYLE_UNITS.has(unit) || unit === 'custom' || unit === 'string' || unit === 'unitless') {
        style[prop] = numValue;
      } else {
        style[prop] = `${numValue}${unit}`;
      }
    } else {
      // Plain string values (position, display, color, etc.)
      style[prop] = value;
    }
  });
  
  return style;
};

export const customStyleToCSSString = (customStyle = {}) => {
  const cssRules = [];
  
  Object.entries(customStyle).forEach(([prop, value]) => {
    if (value === null || value === undefined || value === '') return;

    // Convert camelCase to kebab-case
    const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    let cssValue;
    
    // If it's an object with { value, unit }
    if (typeof value === 'object' && value.value !== undefined && value.value !== '') {
      const numValue = value.value;
      const unit = value.unit ?? 'px';
      
      if (unit === 'size-presets') {
        cssValue = `var(--wp--preset--spacing--${numValue})`;
      } else if (unit === 'layout-presets') {
        if (numValue === 'content') {
          cssValue = 'var(--wp--style--global--content-size)';
        } else if (numValue === 'wide') {
          cssValue = 'var(--wp--style--global--wide-size)';
        }
      } else if (unit === 'font-size-presets') {
        cssValue = `var(--wp--preset--font-size--${numValue})`;
      } else if (KEYWORD_STYLE_UNITS.has(unit) || unit === 'custom' || unit === 'string' || unit === 'unitless') {
        cssValue = numValue;
      } else {
        // Regular units (px, rem, em, %, etc.)
        cssValue = `${numValue}${unit}`;
      }
    } else if (typeof value === 'string' && value !== '') {
      // Plain string values (position, display, color, etc.)
      cssValue = value;
    }
    
    if (cssValue !== undefined && cssValue !== null && cssValue !== '') {
      cssRules.push(`${cssProperty}: ${cssValue}`);
    }
  });
  
  return cssRules.join('; ');
};

/**
 * Converts a customSelectors array into a CSS string for the editor.
 * Data: [ { selector: "&:hover", customStyle: { color: "red" } }, ... ]
/**
 * Converts custom CSS selectors (per-breakpoint) to editor CSS.
 *
 * Data shape: { desktop: [...], tablet: [...], mobile: [...] }
 * For backward compat, a flat array is treated as { desktop: array }.
 *
 * @param {Object|Array} customSelectors  - Breakpoint-keyed object or flat array.
 * @param {string}       uniqueClassName   - Block's unique CSS class.
 * @param {Object}       breakpointOverrides - Optional max-width overrides.
 * @param {Array}        customBreakpoints   - Optional custom breakpoints.
 * @returns {string}
 */
export const customSelectorsToEditorCSS = (
  customSelectors = {},
  uniqueClassName = '',
  breakpointOverrides = {},
  customBreakpoints = []
) => {
  if (!uniqueClassName) return '';

  // Backward compat: if passed a flat array, treat as desktop
  const data = Array.isArray(customSelectors) ? { desktop: customSelectors } : customSelectors;
  if (typeof data !== 'object' || !Object.keys(data).length) return '';

  const processEntries = (entries) => {
    if (!Array.isArray(entries) || !entries.length) return '';
    return entries
      .map(({ selector, customStyle }) => {
        const sel = (selector || '').trim().replace(/[{};]/g, '');
        const rules = customStyleToCSSString(customStyle || {});
        if (!sel || !rules) return '';
        const resolved = sel.replace(/&/g, `.${uniqueClassName}`);
        return `.editor-styles-wrapper ${resolved} { ${rules} }`;
      })
      .filter(Boolean)
      .join('\n');
  };

  // Desktop always renders without @media wrapper
  const desktopCSS = processEntries(data.desktop || []);

  // Non-desktop breakpoints render inside @media
  const styleKeys = Object.keys(data).filter((k) => k !== 'desktop');
  const resolved = resolveBreakpoints(breakpointOverrides, styleKeys, customBreakpoints);

  const responsiveCSS = resolved
    .map(({ key, maxWidth }) => {
      const css = processEntries(data[key]);
      if (!css) return '';
      return `@media (max-width: ${maxWidth}px) {\n${css}\n}`;
    })
    .filter(Boolean)
    .join('\n');

  return [desktopCSS, responsiveCSS].filter(Boolean).join('\n');
};

export const isStyleValueEmpty = (value) => {
  if (value === null || value === undefined) return true;

  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      return value.value === '' || value.value === null || value.value === undefined;
    }

    return Object.keys(value).length === 0;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  return false;
};

const areStyleValuesEqual = (left, right) => {
  if (left === right) return true;
  if (typeof left !== typeof right) return false;

  if (
    left &&
    right &&
    typeof left === 'object' &&
    typeof right === 'object' &&
    Object.prototype.hasOwnProperty.call(left, 'value') &&
    Object.prototype.hasOwnProperty.call(right, 'value')
  ) {
    return left.value === right.value && (left.unit ?? null) === (right.unit ?? null);
  }

  return false;
};

export const hasModifiedStyleProps = (customStyle = {}, props = [], defaults = {}) => {
  return props.some((prop) => {
    const currentValue = customStyle[prop];
    const hasDefault = Object.prototype.hasOwnProperty.call(defaults, prop);

    if (hasDefault) {
      return !areStyleValuesEqual(currentValue, defaults[prop]);
    }

    return !isStyleValueEmpty(currentValue);
  });
};

export const isStylePropSet = (customStyle = {}, prop, defaults = {}) => {
  const currentValue = customStyle?.[prop];
  const hasDefault = Object.prototype.hasOwnProperty.call(defaults, prop);

  if (hasDefault) {
    return !areStyleValuesEqual(currentValue, defaults[prop]);
  }

  return !isStyleValueEmpty(currentValue);
};

/**
 * Returns the modification level for one or more style properties.
 *
 * 0 – not modified (empty)
 * 1 – modified on standalone block (value set, no component master for comparison)
 * 2 – set by master (value matches the master — purple dot)
 * 3 – overridden (value differs from the master — orange dot)
 *
 * @param {Object}  customStyle - The instance's current style values.
 * @param {string[]} props       - Property keys to check.
 * @param {Object}  [masterStyle] - The master's style values (null/undefined when not a component instance).
 * @returns {number}
 */

export const MASTER_PURPLE = '#8a42dd';

export const MODIFICATION_LEVEL_COLORS = {
  1: 'var(--wp-admin-theme-color, #007cba)', // blue – standalone modification
  2: MASTER_PURPLE, // purple – set by master
  3: '#f5a623', // orange – override from master
};

export const getModificationLevel = (customStyle = {}, props = [], masterStyle = null) => {
  let level = 0;

  for (const prop of props) {
    const instanceValue = customStyle?.[prop];
    const hasMasterValue = masterStyle && Object.prototype.hasOwnProperty.call(masterStyle, prop);

    if (hasMasterValue && !isStyleValueEmpty(masterStyle[prop])) {
      if (!areStyleValuesEqual(instanceValue, masterStyle[prop])) {
        level = Math.max(level, 3); // orange – instance override from master
      } else {
        level = Math.max(level, 2); // purple – matches master (set by master)
      }
    } else {
      // No master value for this property (or master value is empty) –
      // check if instance has set something
      if (!isStyleValueEmpty(instanceValue)) {
        // On an instance, the master uses the CSS default (no value).
        // Any value set here is an override from that default.
        level = Math.max(level, masterStyle ? 3 : 1);
      }
    }
  }

  return level;
};

// -- Custom selectors (CSS+) --------------------------------------------------

// Normalizes customSelectors to the per-breakpoint object shape.
// Backward compat: flat array → { desktop: array }.
export function normalizeCustomSelectors(raw) {
  if (Array.isArray(raw)) return { desktop: raw };
  if (raw && typeof raw === 'object') return raw;
  return {};
}

// Level for a single selector entry. Only meaningful on instances (hasMaster):
// purple (2) when it matches the master's matching entry, orange (3) when it
// overrides or is instance-only. Compares the union of instance + master props
// so a cleared master property still counts as an override.
export function getCustomSelectorsEntryLevel(entry = {}, masterEntry = null, hasMaster = false) {
  const instStyle = entry.customStyle || {};
  const masterStyle = hasMaster ? (masterEntry?.customStyle ?? {}) : null;
  const props = [...new Set([
    ...Object.keys(instStyle),
    ...(masterStyle ? Object.keys(masterStyle) : []),
  ])];
  return getModificationLevel(instStyle, props, masterStyle);
}

// Aggregate level for the CSS+ tab title. On a standalone block every entry is
// custom by definition, so blue (1) only signals "something exists here". On an
// instance it compares against the master: 0 when both are empty, purple (2)
// when it matches, orange (3) when it overrides.
export function getCustomSelectorsLevel(customSelectors = {}, masterAttributes = null, activeBreakpoint = null) {
  const inst = normalizeCustomSelectors(customSelectors);
  const hasMaster = masterAttributes != null;
  if (!hasMaster) {
    const bps = activeBreakpoint ? [activeBreakpoint] : Object.keys(inst);
    const hasContent = bps.some((bp) =>
      (inst[bp] || []).some((entry) =>
        Object.keys(entry?.customStyle || {}).some((prop) => !isStyleValueEmpty(entry.customStyle[prop]))
      )
    );
    return hasContent ? 1 : 0;
  }
  const master = normalizeCustomSelectors(masterAttributes.customSelectors);
  const bps = activeBreakpoint
    ? [activeBreakpoint]
    : [...new Set([...Object.keys(inst), ...Object.keys(master)])];
  let max = 0;
  for (const bp of bps) {
    const instEntries = inst[bp] || [];
    const masterEntries = master[bp] || [];
    for (let i = 0; i < instEntries.length; i++) {
      const entry = instEntries[i] || {};
      const masterEntry = masterEntries.find((e) => (e.selector || '') === (entry.selector || '')) || masterEntries[i];
      const lvl = getCustomSelectorsEntryLevel(entry, masterEntry, true);
      if (lvl > max) max = lvl;
    }
  }
  return max;
}

// src/shared/style-helpers.js

export function getNestedValue(obj, pathParts) {
  return pathParts.reduce((acc, key) => acc?.[key], obj);
}

export function setNestedValue(obj, pathParts, value) {
  if (pathParts.length === 1) {
    return { ...obj, [pathParts[0]]: value };
  }
  const [head, ...rest] = pathParts;
  return {
    ...obj,
    [head]: setNestedValue(obj?.[head] || {}, rest, value),
  };
}

export function computeNextStyle(currentStyle, prop, value, unit) {
  // Batch update
  if (prop && typeof prop === 'object' && value === undefined && unit === undefined) {
    const nextStyle = { ...currentStyle };
    Object.entries(prop).forEach(([key, updateValue]) => {
      if (updateValue === '' || updateValue === null || updateValue === undefined || isStyleValueEmpty(updateValue)) {
        delete nextStyle[key];
        return;
      }
      nextStyle[key] = updateValue;
    });
    return nextStyle;
  }

  // Delete property
  if ((value === '' || value === null || value === undefined) && !unit) {
    const { [prop]: removed, ...rest } = currentStyle;
    return rest;
  }

  // Set property
  return { ...currentStyle, [prop]: unit ? { value, unit } : value };
}
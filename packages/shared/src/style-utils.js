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
      if (updateValue === '' || updateValue === null || updateValue === undefined) {
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
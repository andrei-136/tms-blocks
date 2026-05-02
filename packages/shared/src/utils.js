export const generateUniqueId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${timestamp}${random}`;
};

// Returns true when a style value is considered non-default.
// Usage: isStyleValueSet(customStyle.fontSize)
export const isStyleValueSet = (value) => {
  if (value === 0) {
    return true;
  }

  if (value === '' || value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      const inner = value.value;
      return inner !== '' && inner !== null && inner !== undefined;
    }

    return Object.keys(value).length > 0;
  }

  return true;
};

// Returns true if any of the provided style keys are set.
// Usage: hasModifiedStyle(customStyle, ['fontSize', 'lineHeight'])
export const hasModifiedStyle = (customStyle, properties = []) => {
  if (!customStyle || properties.length === 0) {
    return false;
  }

  return properties.some((property) => isStyleValueSet(customStyle[property]));
};

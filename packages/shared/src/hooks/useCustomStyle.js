import { useCallback } from 'react';
import { getNestedValue, setNestedValue, computeNextStyle } from '../style-utils';

export default function useCustomStyle(customStyle, setAttributes, attributeName = 'customStyle') {
  const pathParts = attributeName.split('.');
  const nested    = pathParts.length > 1;

  const updateCustomStyle = useCallback((prop, value, unit) => {
    const currentStyle = nested
      ? (getNestedValue(customStyle, pathParts.slice(1)) || {})
      : (customStyle || {});

    const nextStyle = computeNextStyle(currentStyle, prop, value, unit);

    if (nested) {
      const rootAttribute = pathParts[0];
      const rootValue = (customStyle && typeof customStyle === 'object') ? customStyle : {};
      const nextRootValue = setNestedValue(rootValue, pathParts.slice(1), nextStyle);
      setAttributes({ [rootAttribute]: nextRootValue });
      return;
    }

    setAttributes({ [attributeName]: nextStyle });
  }, [setAttributes, attributeName, nested, customStyle]);

  updateCustomStyle.remove = useCallback((...props) => {
    const currentStyle = nested
      ? (getNestedValue(customStyle, pathParts.slice(1)) || {})
      : (customStyle || {});

    const nextStyle = { ...currentStyle };
    props.forEach((prop) => delete nextStyle[prop]);

    if (nested) {
      const rootAttribute = pathParts[0];
      const rootValue = (customStyle && typeof customStyle === 'object') ? customStyle : {};
      const nextRootValue = setNestedValue(rootValue, pathParts.slice(1), nextStyle);
      setAttributes({ [rootAttribute]: nextRootValue });
      return;
    }

    setAttributes({ [attributeName]: nextStyle });
  }, [setAttributes, attributeName, nested, customStyle]);

  return updateCustomStyle;
}
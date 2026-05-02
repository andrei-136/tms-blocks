// src/shared/hooks/useBreakpointStyles.js

import { useCallback } from 'react';
import { getNestedValue, setNestedValue, computeNextStyle } from '../style-utils';

/**
 * Single hook that handles style updates for any breakpoint and state.
 * Works with fixed and dynamic breakpoints — no per-breakpoint hook calls needed.
 *
 * @param {Object}   responsiveStyle  - The responsiveStyle attribute object
 * @param {Function} setAttributes    - Block's setAttributes function
 * @returns {{ getUpdater, getStyle }}
 */
export default function useBreakpointStyles(responsiveStyle = {}, setAttributes) {

  const getUpdater = useCallback((breakpointKey, state = 'base') => {
    const updater = (prop, value, unit) => {
      const current = responsiveStyle?.[breakpointKey]?.[state] || {};
      const next = computeNextStyle(current, prop, value, unit);

      const nextResponsiveStyle = {
        ...responsiveStyle,
        [breakpointKey]: {
          ...(responsiveStyle?.[breakpointKey] || {}),
          [state]: next,
        },
      };

      setAttributes({ responsiveStyle: nextResponsiveStyle });
    };

    updater.remove = (...props) => {
      const current = responsiveStyle?.[breakpointKey]?.[state] || {};
      const next = { ...current };
      props.forEach((p) => delete next[p]);

      const nextResponsiveStyle = {
        ...responsiveStyle,
        [breakpointKey]: {
          ...(responsiveStyle?.[breakpointKey] || {}),
          [state]: next,
        },
      };

      setAttributes({ responsiveStyle: nextResponsiveStyle });
    };

    return updater;
  }, [setAttributes, responsiveStyle]);

  const getStyle = useCallback((breakpointKey, state = 'base') => {
    return responsiveStyle?.[breakpointKey]?.[state] || {};
  }, [responsiveStyle]);

  return { getUpdater, getStyle };
}
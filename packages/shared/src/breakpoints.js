export const BREAKPOINTS = [
  { key: 'tablet', label: 'Tablet', maxWidth: 1024 },
  { key: 'mobile', label: 'Mobile', maxWidth: 767  },
];

export const BREAKPOINTS_MAP = Object.fromEntries(
  BREAKPOINTS.map((bp) => [bp.key, bp])
);

export function resolveBreakpoints(overrides = {}, styleKeys = [], customBreakpoints = []) {
  const globalKeys  = BREAKPOINTS.map((bp) => bp.key);
  const customKeys  = customBreakpoints.map((bp) => bp.key);
  const overrideKeys = Object.keys(overrides);
  const allKeys     = [...new Set([...globalKeys, ...customKeys, ...overrideKeys, ...styleKeys])];

  // Merge global and custom into one map
  const allDefined = [...BREAKPOINTS, ...customBreakpoints];

  return allKeys
    .map((key) => {
      const defined  = allDefined.find((bp) => bp.key === key);
      const maxWidth = overrides[key] ?? defined?.maxWidth ?? null;
      const label    = defined?.label ?? key;
      return { key, label, maxWidth };
    })
    .filter((bp) => bp.maxWidth)
    .sort((a, b) => b.maxWidth - a.maxWidth);
}
import React from 'react';
import { MODIFICATION_LEVEL_COLORS } from '../style-utils';

export default function PanelTitle({ title, isModified = false, level = 0 }) {
  const dotColor = level > 0
    ? (MODIFICATION_LEVEL_COLORS[level] || MODIFICATION_LEVEL_COLORS[1])
    : (isModified ? MODIFICATION_LEVEL_COLORS[1] : undefined);
  const showDot = isModified || level > 0;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span>{title}</span>
      {showDot && dotColor && (
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '999px',
            backgroundColor: dotColor,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
    </span>
  );
}

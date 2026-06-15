import React from 'react';
import { MODIFICATION_LEVEL_COLORS } from '../style-utils';

export default function ControlLabel({ label, isSet = false, level = 0 }) {
  const dotColor = level > 0
    ? (MODIFICATION_LEVEL_COLORS[level] || MODIFICATION_LEVEL_COLORS[1])
    : (isSet ? MODIFICATION_LEVEL_COLORS[1] : undefined);
  const showDot = isSet || level > 0;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span>{label}</span>
      {showDot && dotColor && (
        <span
          aria-hidden="true"
          style={{
            width: '5px',
            height: '5px',
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

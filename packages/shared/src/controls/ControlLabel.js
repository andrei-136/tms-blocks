import React from 'react';

export default function ControlLabel({ label, isSet = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span>{label}</span>
      {isSet && (
        <span
          aria-hidden="true"
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '999px',
            backgroundColor: 'var(--wp-admin-theme-color, #007cba)',
            display: 'inline-block',
            flexShrink: 0
          }}
        />
      )}
    </span>
  );
}

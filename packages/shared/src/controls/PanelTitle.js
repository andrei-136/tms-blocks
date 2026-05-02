import React from 'react';

export default function PanelTitle({ title, isModified = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span>{title}</span>
      {isModified && (
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
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

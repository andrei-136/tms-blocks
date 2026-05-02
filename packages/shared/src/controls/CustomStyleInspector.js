// CustomStyleInspector.js
import React from 'react';
import { PanelBody, Button, Flex, FlexItem } from '@wordpress/components';
import { customStyleToInlineStyle } from '../style-utils';

const toKebab = (prop) => prop.replace(/([A-Z])/g, '-$1').toLowerCase();

const formatValue = (value) => {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.value !== undefined) {
    if (value.unit === 'size-presets') return `var(--spacing--${value.value})`;
    if (value.unit === 'font-size-presets') return `var(--font-size--${value.value})`;
    if (value.unit === 'custom') return value.value;
    return `${value.value}${value.unit ?? ''}`;
  }
  return JSON.stringify(value);
};

function StyleRow({ prop, value, onRemove }) {
  return (
    <Flex align="center" style={{ padding: '4px 0', borderBottom: '1px solid #e0e0e0' }}>
      <FlexItem style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#1e1e1e', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {toKebab(prop)}
        </span>
        <span style={{ fontSize: '11px', color: '#757575', fontFamily: 'monospace', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatValue(value)}
        </span>
      </FlexItem>
      <FlexItem>
        <Button
          isDestructive
          isSmall
          onClick={() => onRemove(prop)}
          style={{ minWidth: 0 }}
        >
          âœ•
        </Button>
      </FlexItem>
    </Flex>
  );
}

export default function CustomStyleInspector({ customStyle = {}, updateCustomStyle, label = 'customStyle' }) {
  const entries = Object.entries(customStyle).filter(([, v]) => v !== '' && v !== null && v !== undefined);

  const handleRemove = (prop) => {
    updateCustomStyle(prop, null);
  };

  const handleClearAll = () => {
    const nulled = Object.keys(customStyle).reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});
    updateCustomStyle(nulled);
  };

  return (
    <PanelBody
      title={`Style Inspector - ${label} (${entries.length})`}
      initialOpen={false}
    >
      {entries.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#757575', margin: 0 }}>No styles set.</p>
      ) : (
        <>
          <div style={{ marginBottom: '8px' }}>
            {entries.map(([prop, value]) => (
              <StyleRow
                key={prop}
                prop={prop}
                value={value}
                onRemove={handleRemove}
              />
            ))}
          </div>
          <Button
            isDestructive
            isSmall
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </>
      )}
    </PanelBody>
  );
}

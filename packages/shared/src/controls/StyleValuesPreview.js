import React from 'react';
import { PanelBody } from '@wordpress/components';

const prettyJson = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function StyleValuesPreview({ attributes = {} }) {
  const { customStyle = {}, utilityClasses = '' } = attributes;

  return (
    <PanelBody title="Style Inspector" initialOpen={false}>
      <div style={{ marginBottom: '8px' }}>
        <strong>customStyle</strong>
        <pre style={{
          margin: '6px 0 0',
          padding: '8px',
          background: '#f6f7f7',
          border: '1px solid #ddd',
          fontSize: '11px',
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {prettyJson(customStyle)}
        </pre>
      </div>
        
     
    </PanelBody>
  );
}

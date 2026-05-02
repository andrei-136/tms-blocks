import React from 'react';
import { CheckboxControl } from '@wordpress/components';

export default function RenderControls({ value = true, onChange, help = '' }) {
  return (
    <CheckboxControl style={{ padding: '8px 0px' }}
      label="Render Block on Frontend"
      checked={value}
      onChange={onChange}
      help={help}
    />
  );
}

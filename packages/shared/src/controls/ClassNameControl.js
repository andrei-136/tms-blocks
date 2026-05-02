import React, { useRef, useEffect, useState } from 'react';
import { TextareaControl } from '@wordpress/components';

function collapseClassNames(value) {
  return value
    .replace(/[\s]+/g, ' ')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .trim();
}

export default function ClassNameControl({ value = '', onChange, help = '' }) {
  const textareaRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current?.querySelector('textarea');
    if (textarea) {
      textarea.style.overflow = 'hidden';
      textarea.style.resize = 'none';
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(textarea.scrollHeight, 24) + 'px';
    }
  }, [localValue]);

  return (
    <div ref={textareaRef}>
      <TextareaControl
        label="Classes"
        value={localValue}
        onChange={(val) => setLocalValue(val)}
        onBlur={() => onChange(collapseClassNames(localValue))}
        help={help}
        rows={1}
      />
    </div>
  );
}

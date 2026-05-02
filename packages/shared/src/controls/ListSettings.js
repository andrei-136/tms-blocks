import React from 'react';
import { SelectControl } from '@wordpress/components';

export default function ListSettings({ attributes, setAttributes, customStyle = {}, updateCustomStyle }) {
  const { tagName } = attributes;

  return (
    <>
     
        <SelectControl
          label="List Type"
          value={tagName}
          options={[
            { label: 'Unordered List (ul)', value: 'ul' },
            { label: 'Ordered List (ol)', value: 'ol' }
          ]}
          onChange={(value) => setAttributes({ tagName: value })}
        />
    </>
  );
}

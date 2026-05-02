import React from 'react';
import { TextControl, ToggleControl } from '@wordpress/components';

export default function ListItemSettings({ attributes, setAttributes, editContent, setEditContent, customStyle = {}, updateCustomStyle }) {
  const { content } = attributes;

  const handleToggle = (value) => {
    setEditContent(value);
  };

  return (
    <>
      
        {false && (
          <ToggleControl
            label="Edit Content"
            checked={editContent}
            onChange={handleToggle}
            help="Enable to edit text content in the inspector"
          />
        )}
        {editContent && (
          <TextControl
            label="Text Content"
            value={content ? content.replace(/<[^>]*>/g, '') : ''}
            onChange={(value) => setAttributes({ content: value })}
            help="Edit the text content of this list item"
          />
        )}
    </>
  );
}

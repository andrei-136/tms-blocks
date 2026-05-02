import metadata from './block.json';
import Edit from './edit';
import save from './save';
import { registerBlockType, createBlock } from '@wordpress/blocks';

registerBlockType(metadata.name, {
  ...metadata,
  transforms: {
    to: [
      {
        type: 'block',
        blocks: ['tmsblocks/paragraph'],
        transform: (attributes) =>
          createBlock('tmsblocks/paragraph', {
            content: attributes.content || '',
            renderBlock: attributes.renderBlock ?? true,
            uniqueId: attributes.uniqueId,
            anchorId: attributes.anchorId || '',
            ariaLabel: attributes.ariaLabel || '',
            role: attributes.role || '',
            customAttributes: attributes.customAttributes || '',
            customStyle: attributes.customStyle || {},
            utilityClasses: attributes.utilityClasses || '',
            tmsClassName: attributes.tmsClassName || ''
          })
      }
    ]
  },
  edit: Edit,
  save,
});

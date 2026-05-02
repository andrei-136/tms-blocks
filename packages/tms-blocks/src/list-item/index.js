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
        blocks: ['tmsblocks/generic-block'],
        transform: (attributes, innerBlocks = []) => {
          const contentBlocks = attributes.content
            ? [createBlock('tmsblocks/paragraph', { content: attributes.content })]
            : [];

          return createBlock(
            'tmsblocks/generic-block',
            {
              renderBlock: attributes.renderBlock ?? true,
              uniqueId: attributes.uniqueId,
              tagName: 'li',
              anchorId: attributes.anchorId || '',
              ariaLabel: attributes.ariaLabel || '',
              ariaRole: attributes.ariaRole || '',
              extraAriaAttributes: attributes.extraAriaAttributes || [],
              customAttributes: attributes.customAttributes || [],
              customStyle: attributes.customStyle || {},
              customStyleHover: attributes.customStyleHover || {},
              customStyleFocusVisible: attributes.customStyleFocusVisible || {},
              responsiveStyle: attributes.responsiveStyle || {},
              breakpointOverrides: attributes.breakpointOverrides || {},
              tmsClassName: attributes.tmsClassName || '',
            },
            [...contentBlocks, ...(innerBlocks || [])]
          );
        },
      },
    ],
  },
  edit: Edit,
  save,
});

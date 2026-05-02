import { addFilter } from '@wordpress/hooks';

addFilter(
    'blocks.registerBlockType',
    'tmsblocks/disable-classname-ui',
    (settings, name) => {
        if (typeof name !== 'string' || !name.startsWith('tmsblocks/')) {
            return settings;
        }

        if (!settings || typeof settings !== 'object') {
            return settings;
        }

        return {
            ...settings,
            supports: {
                ...settings.supports,
                className: false,
                customClassName: false  // this is the older API key
            }
        };
    }
);

addFilter(
    'blocks.registerBlockType',
    'tmsblocks/temporary-disable-core-deprecations',
    (settings, name) => {
        if (name !== 'core/list') {
            return settings;
        }

        if (!settings || typeof settings !== 'object') {
            return settings;
        }

        return {
            ...settings,
            deprecated: []
        };
    }
);

import { subscribe } from '@wordpress/data';
import { dispatch, select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';




// const TARGET_PARENTS = new Set(['tms/anchor', 'tms/button', 'tms/list-item']);

// let isPending = false;

// subscribe(() => {
//   if (isPending) return;

//   // Only look at blocks that were just selected ” avoids scanning everything
//   const selectedClientId = select(blockEditorStore).getSelectedBlockClientId();
//   if (!selectedClientId) return;

//   const selectedBlock = select(blockEditorStore).getBlock(selectedClientId);
//   if (!selectedBlock || selectedBlock.name !== 'core/paragraph') return;

//   const parents = select(blockEditorStore).getBlockParents(selectedClientId);
//   if (!parents.length) return;

//   const directParentId = parents[parents.length - 1];
//   const parentBlock = select(blockEditorStore).getBlock(directParentId);
//   if (!parentBlock || !TARGET_PARENTS.has(parentBlock.name)) return;

//   isPending = true;
//   requestAnimationFrame(() => {
//     dispatch(blockEditorStore).replaceBlock(
//       selectedClientId,
//       createBlock('tms/paragraph', {
//         content: selectedBlock.attributes.content ?? '',
//       })
//     );
//     isPending = false;
//   });
// });

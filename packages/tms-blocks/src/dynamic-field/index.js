import metadata from './block.json';
import Edit from './edit';
import save from './save';
import { registerBlockType } from '@wordpress/blocks';

registerBlockType(metadata.name, {
  ...metadata,
  edit: Edit,
  save
});

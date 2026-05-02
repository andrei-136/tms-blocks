import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
  // Save inner blocks content (required for dynamic blocks with child blocks)
  return <InnerBlocks.Content />;
}

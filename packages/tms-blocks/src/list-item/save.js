import { InnerBlocks, RichText } from '@wordpress/block-editor';

export default function save({ attributes }) {
  const { content = '' } = attributes;

  return (
    <>
      
      <InnerBlocks.Content />
    </>
  );
}

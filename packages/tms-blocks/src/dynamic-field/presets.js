// Dynamic Field Block Presets
//
// Each preset configures multiple block attributes at once.
//
// Fields:
//   label       - shown in the dropdown
//   value       - unique key
//   description - shown as help text when selected
//   param       - null | 'taxonomy' - if set, a secondary picker is shown
//   apply(param) - function returning the attribute patch to set
//                  param is the taxonomy slug when param === 'taxonomy', else null

export const DYNAMIC_FIELD_PRESETS = [
  {
    label:       'Category names -> archive links',
    value:       'category-links',
    description: 'Displays category names, each linking to its archive page.',
    param:       null,
    apply: () => ({
      steps:         [{ type: 'terms', value: 'category' }, { type: 'term', value: 'name' }],
      path:          'terms:category.term:name',
      itemType:      'url',
      itemTagName:   'a',
      hrefSource:    'path',
      hrefSteps:     [{ type: 'terms', value: 'category' }, { type: 'term', value: 'archive' }],
      hrefPath:      'terms:category.term:archive',
      linkLabelMode: 'dynamic',
      separator:     ', ',
    }),
  },
  {
    label:       'Tag names -> archive links',
    value:       'tag-links',
    description: 'Displays tag names, each linking to its archive page.',
    param:       null,
    apply: () => ({
      steps:         [{ type: 'terms', value: 'post_tag' }, { type: 'term', value: 'name' }],
      path:          'terms:post_tag.term:name',
      itemType:      'url',
      itemTagName:   'a',
      hrefSource:    'path',
      hrefSteps:     [{ type: 'terms', value: 'post_tag' }, { type: 'term', value: 'archive' }],
      hrefPath:      'terms:post_tag.term:archive',
      linkLabelMode: 'dynamic',
      separator:     ', ',
    }),
  },
  {
    label:       'Custom taxonomy -> archive links',
    value:       'taxonomy-links',
    description: 'Term names from a chosen taxonomy, each linking to its archive.',
    param:       'taxonomy',
    apply: (taxonomy) => ({
      steps:         [{ type: 'terms', value: taxonomy }, { type: 'term', value: 'name' }],
      path:          `terms:${taxonomy}.term:name`,
      itemType:      'url',
      itemTagName:   'a',
      hrefSource:    'path',
      hrefSteps:     [{ type: 'terms', value: taxonomy }, { type: 'term', value: 'archive' }],
      hrefPath:      `terms:${taxonomy}.term:archive`,
      linkLabelMode: 'dynamic',
      separator:     ', ',
    }),
  },
  {
    label:       'Post title -> permalink',
    value:       'post-title-link',
    description: 'Displays the post title linking to its permalink.',
    param:       null,
    apply: () => ({
      steps:         [{ type: 'post', value: 'title' }],
      path:          'post:title',
      itemType:      'url',
      itemTagName:   'a',
      hrefSource:    'path',
      hrefSteps:     [{ type: 'post', value: 'permalink' }],
      hrefPath:      'post:permalink',
      linkLabelMode: 'dynamic',
      separator:     ', ',
    }),
  },
  {
    label:       'Post title (text only)',
    value:       'post-title-text',
    description: 'Displays the post title as plain text.',
    param:       null,
    apply: () => ({
      steps:     [{ type: 'post', value: 'title' }],
      path:      'post:title',
      itemType:  'text',
      separator: ', ',
    }),
  },
  {
    label:       'Author name -> author archive',
    value:       'author-archive-link',
    description: 'Displays the author display name linking to their archive.',
    param:       null,
    apply: () => ({
      steps:         [{ type: 'author', value: '' }, { type: 'user', value: 'display_name' }],
      path:          'author.user:display_name',
      itemType:      'url',
      itemTagName:   'a',
      hrefSource:    'path',
      hrefSteps:     [{ type: 'author', value: '' }, { type: 'user', value: 'archive' }],
      hrefPath:      'author.user:archive',
      linkLabelMode: 'dynamic',
      separator:     ', ',
    }),
  },
  {
    label:       'Featured image URL',
    value:       'featured-image-url',
    description: 'Resolves the featured image URL. Use with Image item type.',
    param:       null,
    apply: () => ({
      steps:    [{ type: 'post', value: 'featured_image_url' }],
      path:     'post:featured_image_url',
      itemType: 'image',
      separator: '',
    }),
  },
];

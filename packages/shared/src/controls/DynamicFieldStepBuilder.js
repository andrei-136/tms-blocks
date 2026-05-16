import React, { useEffect, useState, useMemo } from 'react';
import {
  BaseControl,
  SelectControl,
  TextControl,
  Button,
  Notice
} from '@wordpress/components';

// â”€â”€ Step type options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STEP_TYPES = [
  { label: 'Select step',      value: '' },
  { label: 'Taxonomy terms', value: 'terms' },
  { label: 'Parent term',      value: 'parent' },
  { label: 'Author',           value: 'author' },
  { label: 'Meta field',       value: 'meta' },
  { label: 'Post property',    value: 'post' },
  { label: 'Term property',    value: 'term' },
  { label: 'User property',    value: 'user' },
  { label: 'Link (URL)',       value: 'link' },
  { label: 'Comments count',   value: 'comments' },
];

// â”€â”€ Property lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const POST_PROPERTIES = [
  { label: 'Select property', value: '' },
  { label: 'Title',           value: 'title' },
  { label: 'Slug',            value: 'slug' },
  { label: 'Date',            value: 'date' },
  { label: 'Modified date',   value: 'modified' },
  { label: 'Excerpt',         value: 'excerpt' },
  { label: 'Permalink',       value: 'permalink' },
  { label: 'Comments link',   value: 'comments_link' },
  { label: 'ID',              value: 'id' },
  { label: 'Featured image URL', value: 'featured_image_url' },
  { label: 'Featured image alt', value: 'featured_image_alt' },
  { label: 'Attachment URL',     value: 'attachment_url' },
  { label: 'Attachment alt',     value: 'attachment_alt' },
  { label: 'Caption',            value: 'caption' },
];

const TERM_PROPERTIES = [
  { label: 'Select property', value: '' },
  { label: 'Name',            value: 'name' },
  { label: 'Slug',            value: 'slug' },
  { label: 'Description',     value: 'description' },
  { label: 'Archive URL',     value: 'archive' },
  { label: 'Count',           value: 'count' },
  { label: 'ID',              value: 'id' },
];

const USER_PROPERTIES = [
  { label: 'Select property', value: '' },
  { label: 'Display name',    value: 'display_name' },
  { label: 'First name',      value: 'first_name' },
  { label: 'Last name',       value: 'last_name' },
  { label: 'Nickname',        value: 'nickname' },
  { label: 'Email',           value: 'email' },
  { label: 'URL',             value: 'url' },
  { label: 'Login',           value: 'login' },
  { label: 'Archive URL',     value: 'archive' },
];

const LINK_PROPERTIES = [
  { label: 'Select link type',    value: '' },
  { label: 'Post permalink',      value: 'permalink' },
  { label: 'Post comments link',  value: 'comments_link' },
  { label: 'Previous post URL',   value: 'previous_post' },
  { label: 'Next post URL',       value: 'next_post' },
  { label: 'Term archive URL',    value: 'term_archive' },
  { label: 'Author archive URL',  value: 'author_archive' },
  { label: 'Author mailto:',      value: 'author_mailto' },
];

function getLinkPropertiesForActiveType(activeType) {
  if (activeType === 'post') {
    return LINK_PROPERTIES.filter((o) => !o.value || ['permalink','comments_link','previous_post','next_post'].includes(o.value));
  }
  if (activeType === 'term') {
    return LINK_PROPERTIES.filter((o) => !o.value || o.value === 'term_archive');
  }
  if (activeType === 'user') {
    return LINK_PROPERTIES.filter((o) => !o.value || ['author_archive','author_mailto'].includes(o.value));
  }
  return LINK_PROPERTIES;
}

// â”€â”€ Active item type resolver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getActiveItemType(steps, beforeIndex) {
  let type = 'post';
  for (let i = 0; i < beforeIndex; i++) {
    const s = steps[i];
    if (!s?.type) continue;
    switch (s.type) {
      case 'terms':
      case 'parent':
        type = 'term'; break;
      case 'author':
        type = 'user'; break;
      case 'user':
        // If user step has a property value, result is scalar; otherwise we're still in user context
        type = s.value ? 'scalar' : 'user'; break;
      case 'meta':
      case 'post':
      case 'term':
      case 'comments':
        type = 'scalar'; break;
      case 'link':
        type = (s.value === 'previous_post' || s.value === 'next_post') ? 'post' : 'scalar';
        break;
      default: break;
    }
  }
  return type;
}

// â”€â”€ Preset definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PRESETS = [
  { label: 'Select a field...',       value: '',                         steps: null, param: null },
  { label: 'Post title',            value: 'post:title',               steps: [{ type: 'post',     value: 'title' }],           param: null },
  { label: 'Post excerpt',          value: 'post:excerpt',             steps: [{ type: 'post',     value: 'excerpt' }],         param: null },
  { label: 'Post date',             value: 'post:date',                steps: [{ type: 'post',     value: 'date' }],            param: null },
  { label: 'Post modified date',    value: 'post:modified',            steps: [{ type: 'post',     value: 'modified' }],        param: null },
  { label: 'Post permalink',        value: 'post:permalink',           steps: [{ type: 'post',     value: 'permalink' }],       param: null },
  { label: 'Post slug',             value: 'post:slug',                steps: [{ type: 'post',     value: 'slug' }],            param: null },
  { label: 'Post ID',               value: 'post:id',                  steps: [{ type: 'post',     value: 'id' }],              param: null },
  { label: 'Featured image URL', value: 'post:featured_image_url', steps: [{ type: 'post', value: 'featured_image_url' }], param: null },
  { label: 'Featured image alt', value: 'post:featured_image_alt', steps: [{ type: 'post', value: 'featured_image_alt' }], param: null },
  { label: 'Attachment URL',     value: 'post:attachment_url',     steps: [{ type: 'post', value: 'attachment_url' }],     param: null },
  { label: 'Attachment alt',     value: 'post:attachment_alt',     steps: [{ type: 'post', value: 'attachment_alt' }],     param: null },
  { label: 'Caption',            value: 'post:caption',            steps: [{ type: 'post', value: 'caption' }],            param: null },
  { label: 'Comment count',         value: 'comments',                 steps: [{ type: 'comments', value: '' }],               param: null },
  { label: 'Author name',           value: 'author.user:display_name', steps: [{ type: 'author', value: '' }, { type: 'user', value: 'display_name' }], param: null },
  { label: 'Author first name',     value: 'author.user:first_name',   steps: [{ type: 'author', value: '' }, { type: 'user', value: 'first_name' }],   param: null },
  { label: 'Author last name',      value: 'author.user:last_name',    steps: [{ type: 'author', value: '' }, { type: 'user', value: 'last_name' }],    param: null },
  { label: 'Author archive URL',    value: 'author.user:archive',      steps: [{ type: 'author', value: '' }, { type: 'user', value: 'archive' }],      param: null },
  { label: 'Author email',          value: 'author.user:email',        steps: [{ type: 'author', value: '' }, { type: 'user', value: 'email' }],        param: null },
  { label: 'Categories',         value: 'terms:category.term:name',    steps: [{ type: 'terms', value: 'category' }, { type: 'term', value: 'name' }],    param: null },
  { label: 'Category archive URL',  value: 'terms:category.term:archive', steps: [{ type: 'terms', value: 'category' }, { type: 'term', value: 'archive' }], param: null },
  { label: 'Tags',              value: 'terms:post_tag.term:name',    steps: [{ type: 'terms', value: 'post_tag' }, { type: 'term', value: 'name' }],    param: null },
  { label: 'Tag archive URL',       value: 'terms:post_tag.term:archive', steps: [{ type: 'terms', value: 'post_tag' }, { type: 'term', value: 'archive' }], param: null },
  { label: 'Custom field (meta)...',  value: '__meta',                   steps: null, param: 'metaKey'  },
  { label: 'Term name...',            value: '__term_name',              steps: null, param: 'taxonomy' },
  { label: 'Term archive URL...',     value: '__term_archive',           steps: null, param: 'taxonomy' },
];

function detectPreset(steps, path) {
  const hasConfiguredSteps = Array.isArray(steps)
    && steps.some((step) => step?.type || step?.value);

  if (!path && !hasConfiguredSteps) return '';
  const exact = PRESETS.find((p) => p.steps !== null && p.value === path);
  if (exact) return exact.value;
  if (steps?.length === 1 && steps[0]?.type === 'meta' && steps[0]?.value) return '__meta';
  if (steps?.length === 2 && steps[0]?.type === 'terms' && steps[0]?.value && steps[1]?.type === 'term') {
    if (steps[1]?.value === 'name')    return '__term_name';
    if (steps[1]?.value === 'archive') return '__term_archive';
  }
  return path || hasConfiguredSteps ? '__advanced' : '';
}

function hasOnlyPlaceholderSteps(steps) {
  return Array.isArray(steps)
    && steps.length > 0
    && steps.every((step) => !step?.type && !step?.value);
}

function stepsToPath(steps) {
  if (!Array.isArray(steps)) return '';
  return steps
    .map((step) => {
      if (!step || !step.type) return '';
      if (step.type === 'parent' || step.type === 'author' || step.type === 'comments') return step.type;
      if (step.value) return `${step.type}:${step.value}`;
      return '';
    })
    .filter(Boolean)
    .join('.');
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DynamicFieldStepBuilder({
  steps = [],
  taxonomyOptions = [],
  postMetaOptions = [],
  termMetaOptionsByTax = {},
  userMetaOptions = [],
  onPathChange,   // (steps, path) -> void - used by preset mode
  label = 'Content',
  help  = 'Connect the dots: post -> term -> property -> value.',
  renderAdvancedContent = null,
}) {
  // â”€â”€ Preset mode state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const currentPath = useMemo(() => stepsToPath(steps), [steps]);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const detectedPreset = detectPreset(steps, currentPath);
    return detectedPreset === '__advanced' ? '' : detectedPreset;
  });
  const [isAdvanced, setIsAdvanced] = useState(() => detectPreset(steps, currentPath) === '__advanced');

  useEffect(() => {
    const detectedPreset = detectPreset(steps, currentPath);

    if (detectedPreset === '__advanced') {
      setIsAdvanced(true);
      return;
    }

    setSelectedPreset(detectedPreset);

    if (detectedPreset) {
      setIsAdvanced(false);
    }
  }, [steps, currentPath]);

  // Param values derived from current steps
  const currentMetaKey  = selectedPreset === '__meta'
    && steps[0]?.type === 'meta'   ? (steps[0]?.value || '') : '';
  const currentTaxonomy = (selectedPreset === '__term_name' || selectedPreset === '__term_archive')
    && steps[0]?.type === 'terms'  ? (steps[0]?.value || '') : '';

  const handlePresetChange = (value) => {
    setIsAdvanced(false);
    setSelectedPreset(value);
    if (!value) { onPathChange?.([], ''); return; }
    const preset = PRESETS.find((p) => p.value === value);
    if (!preset) return;
    if (preset.steps && !preset.param) {
      onPathChange?.(preset.steps, preset.value);
    }
  };

  const handleMetaKeyChange = (metaKey) => {
    if (!metaKey) { onPathChange?.([], ''); return; }
    onPathChange?.([{ type: 'meta', value: metaKey }], `meta:${metaKey}`);
  };

  const handleTaxonomyChange = (taxonomy) => {
    if (!taxonomy) { onPathChange?.([], ''); return; }
    const termProp = selectedPreset === '__term_archive' ? 'archive' : 'name';
    onPathChange?.(
      [{ type: 'terms', value: taxonomy }, { type: 'term', value: termProp }],
      `terms:${taxonomy}.term:${termProp}`
    );
  };

  // â”€â”€ Advanced mode state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [editingIndex, setEditingIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const handleAdvancedToggle = () => {
    if (isAdvanced) {
      const detectedPreset = detectPreset(steps, currentPath);

      setSelectedPreset(detectedPreset === '__advanced' ? '' : detectedPreset);
      setIsAdvanced(false);
      return;
    }

    setIsAdvanced(true);
  };

  const getValidStepTypesForActiveType = (activeType) =>
    STEP_TYPES.filter((opt) => {
      if (opt.value === '')          return true;
      if (activeType === 'scalar')   return false;
      if (opt.value === 'terms')     return activeType === 'post';
      if (opt.value === 'parent')    return activeType === 'term';
      if (opt.value === 'author')    return activeType === 'post';
      if (opt.value === 'meta')      return ['post','term','user'].includes(activeType);
      if (opt.value === 'post')      return activeType === 'post';
      if (opt.value === 'term')      return activeType === 'term';
      if (opt.value === 'user')      return ['user','term'].includes(activeType); // Allow user lookup from term (by slug)
      if (opt.value === 'link')      return ['post','term','user'].includes(activeType);
      if (opt.value === 'comments')  return activeType === 'post';
      return true;
    });

  const nextStepActiveType  = getActiveItemType(steps, steps.length);
  const canShowAddStep      = steps.length === 0 || getValidStepTypesForActiveType(nextStepActiveType).length > 1;

  const getOptionLabel = (options, value, fallback) => {
    if (!value) return fallback;
    return (options || []).find((e) => e.value === value)?.label || value;
  };

  const emitSteps = (nextSteps) => {
    onPathChange?.(nextSteps, stepsToPath(nextSteps));
  };

  const updateStep = (index, patch) => {
    const nextSteps = steps.map((step, stepIndex) => (
      stepIndex !== index ? step : { ...step, ...patch }
    ));
    emitSteps(nextSteps);
  };

  const addStep = () => {
    emitSteps([...steps, { type: '', value: '' }]);
  };

  const removeStep = (index) => {
    emitSteps(steps.filter((_, stepIndex) => stepIndex !== index));
  };

  const getTaxonomyForStep = (index) => {
    for (let stepIndex = index - 1; stepIndex >= 0; stepIndex--) {
      if (steps[stepIndex]?.type === 'terms' && steps[stepIndex].value) return steps[stepIndex].value;
    }
    return '';
  };

  const getPillLabel = (step, index) => {
    if (!step?.type) return `Step ${index + 1}`;
    if (step.type === 'terms')    return getOptionLabel(taxonomyOptions, step.value, 'Terms');
    if (step.type === 'author')   return 'Author';
    if (step.type === 'parent')   return 'Parent';
    if (step.type === 'comments') return 'Comments';
    if (step.type === 'post')     return getOptionLabel(POST_PROPERTIES, step.value, 'Post');
    if (step.type === 'term')     return getOptionLabel(TERM_PROPERTIES, step.value, 'Term');
    if (step.type === 'user')     return getOptionLabel(USER_PROPERTIES, step.value, 'User');
    if (step.type === 'link') {
      return getOptionLabel(getLinkPropertiesForActiveType(getActiveItemType(steps, index)), step.value, 'Link');
    }
    if (step.type === 'meta') {
      if (!step.value) return 'Meta';
      const activeType = getActiveItemType(steps, index);
      if (activeType === 'user') return getOptionLabel(userMetaOptions, step.value, step.value);
      const taxonomy    = getTaxonomyForStep(index);
      const termOptions = taxonomy ? termMetaOptionsByTax[taxonomy] : null;
      if (taxonomy && Array.isArray(termOptions) && termOptions.length > 1) return getOptionLabel(termOptions, step.value, step.value);
      if (activeType !== 'term' && postMetaOptions.length > 1) return getOptionLabel(postMetaOptions, step.value, step.value);
      return step.value;
    }
    return STEP_TYPES.find((e) => e.value === step.type)?.label || 'Step';
  };

  const renderStepEditor = () => {
    if (editingIndex === null || editingIndex < 0 || editingIndex >= steps.length) return null;
    const step       = steps[editingIndex] || {};
    const activeType = getActiveItemType(steps, editingIndex);
    const validTypes = getValidStepTypesForActiveType(activeType);
    if (editingIndex === 1 && validTypes.length <= 1) return null;

    const completeUpdate = (patch) => { updateStep(editingIndex, patch); setEditingIndex(null); };
    const updateTypeOnly = (value)  => updateStep(editingIndex, { type: value, value: '' });

    return (
      <div style={{ marginTop: '8px', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '6px', backgroundColor: '#fff' }}>
        <SelectControl label={`Step ${editingIndex + 1}`} value={step.type || ''} options={validTypes} onChange={updateTypeOnly} />

        {step.type === 'terms' && (
          <SelectControl label="Taxonomy" value={step.value || ''} options={taxonomyOptions} onChange={(v) => completeUpdate({ value: v })} />
        )}

        {step.type === 'meta' && (() => {
          if (activeType === 'user') {
            return userMetaOptions.length > 1
              ? <SelectControl label="User meta key" value={step.value || ''} options={userMetaOptions} onChange={(v) => completeUpdate({ value: v })} />
              : <TextControl   label="User meta key" value={step.value || ''} onChange={(v) => updateStep(editingIndex, { value: v })} onBlur={() => setEditingIndex(null)} placeholder="e.g. twitter" />;
          }
          const taxonomy    = getTaxonomyForStep(editingIndex);
          const termOptions = taxonomy ? termMetaOptionsByTax[taxonomy] : null;
          if (taxonomy && Array.isArray(termOptions) && termOptions.length > 1) {
            return <SelectControl label="Meta key" value={step.value || ''} options={termOptions} onChange={(v) => completeUpdate({ value: v })} />;
          }
          return postMetaOptions.length > 1 && activeType !== 'term'
            ? <SelectControl label="Meta key" value={step.value || ''} options={postMetaOptions} onChange={(v) => completeUpdate({ value: v })} />
            : <TextControl   label="Meta key" value={step.value || ''} onChange={(v) => updateStep(editingIndex, { value: v })} onBlur={() => setEditingIndex(null)} placeholder="e.g. release_year" />;
        })()}

        {step.type === 'post' && <SelectControl label="Post property" value={step.value || ''} options={POST_PROPERTIES} onChange={(v) => completeUpdate({ value: v })} />}
        {step.type === 'term' && <SelectControl label="Term property" value={step.value || ''} options={TERM_PROPERTIES}  onChange={(v) => completeUpdate({ value: v })} />}
        {step.type === 'user' && <SelectControl label="User property" value={step.value || ''} options={USER_PROPERTIES}  onChange={(v) => completeUpdate({ value: v })} />}
        {step.type === 'link' && <SelectControl label="Link type"     value={step.value || ''} options={getLinkPropertiesForActiveType(activeType)} onChange={(v) => completeUpdate({ value: v })} />}

        {step.type === 'author'   && <p style={{ fontSize: '11px', color: '#757575', margin: '4px 0 0' }}>Resolves to the post author.</p>}
        {step.type === 'comments' && <p style={{ fontSize: '11px', color: '#757575', margin: '4px 0 0' }}>Resolves to the comment count. Configure labels below.</p>}
      </div>
    );
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div style={{ marginTop: '16px' }}>
    <BaseControl label={label} >
      

      {/* â”€â”€ Advanced toggle â”€â”€ */}
      <div style={{ marginBottom: '8px' }}>
        <Button
          variant="link"
          isSmall
          onClick={handleAdvancedToggle}
          style={{ fontSize: '11px' }}
        >
          {isAdvanced ? '<- Back to presets' : 'Advanced ->'}
        </Button>
      </div>
      
      

      {/* â”€â”€ Preset mode â”€â”€ */}
      {!isAdvanced ? (
        <>
          <SelectControl
            label="Field"
            hideLabelFromVision
            value={selectedPreset}
            options={PRESETS}
            onChange={handlePresetChange}
          />

          {selectedPreset === '__meta' && (
            postMetaOptions.length > 1
              ? <SelectControl label="Meta key"  value={currentMetaKey}  options={postMetaOptions} onChange={handleMetaKeyChange} />
              : <TextControl   label="Meta key"  value={currentMetaKey}  onChange={handleMetaKeyChange} placeholder="e.g. release_year" />
          )}

          {(selectedPreset === '__term_name' || selectedPreset === '__term_archive') && (
            <SelectControl label="Taxonomy" value={currentTaxonomy} options={taxonomyOptions} onChange={handleTaxonomyChange} />
          )}
        </>
      ) : (
        /* â”€â”€ Advanced mode â”€â”€ */
        <>
          <div
            style={{ border: '1px solid #dcdcde', borderRadius: '6px', padding: '10px', backgroundColor: '#fff', marginBottom: '4px' }}
          >
            <p className="components-base-control__help" style={{ margin: '0 0 8px' }}>{help}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: '4px', marginBottom: '12px' }}>
              {!steps.length && (
                <Notice status="info" isDismissible={false}>Add steps to build the field path.</Notice>
              )}

              {steps.map((step, index) => (
                <React.Fragment key={`step-pill-${index}`}>
                  <div
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Button
                      variant={editingIndex === index ? 'primary' : 'secondary'}
                      isSmall
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      style={{ borderRadius: '999px', padding: '2px 10px', minHeight: '28px' }}
                    >
                      {getPillLabel(step, index)}
                    </Button>

                    {hoveredIndex === index && (
                      <Button
                        isSmall isDestructive
                        onClick={() => {
                          removeStep(index);
                          setEditingIndex((ci) => ci === null ? null : ci === index ? null : ci > index ? ci - 1 : ci);
                        }}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', minWidth: '18px', width: '18px',
                          height: '18px', borderRadius: '999px', lineHeight: '0', padding: '0',
                          display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#8b99d8' }}
                      >
                        &times;
                      </Button>
                    )}
                  </div>

                  {index < steps.length - 1 && (
                    <span aria-hidden="true" style={{ width: '6px', height: '1px', backgroundColor: '#3858e9', display: 'inline-block' }} />
                  )}
                </React.Fragment>
              ))}

              {canShowAddStep && (
                <Button variant="secondary" isSmall
                  onClick={() => { addStep(); setEditingIndex(steps.length); }}
                  style={{ borderRadius: '4px', minWidth: '20px', width: '20px', height: '20px', padding: '0',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', fontWeight: '700', marginLeft: '6px' }}
                  aria-label="Add step"
                >
                  +
                </Button>
              )}
            </div>

            {renderStepEditor()}
          </div>

          {renderAdvancedContent && (
            <div style={{ marginTop: '8px' }}>
              {renderAdvancedContent()}
            </div>
          )}
        </>
      )}
    </BaseControl>
    </div>
  );
}

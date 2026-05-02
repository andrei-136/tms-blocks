import React, { useMemo } from 'react';
import { TextControl, SelectControl, CheckboxControl, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import ControlLabel from './ControlLabel';
import DynamicFieldSettings from './DynamicFieldSettings';
import useDynamicField from '../hooks/useDynamicField';

const stepsToPath = (steps) => {
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
};

export default function AnchorSettings({ attributes, setAttributes, context = {} }) {
  const {
    href                     = '',
    isDynamic                = false,
    dynamicPath              = '',
    dynamicSteps             = [],
    dynamicDateFormat        = '',
    dynamicCommentsNoText    = '',
    dynamicCommentsOneText   = '',
    dynamicCommentsManyText  = '',
    isInnerTextDynamic       = false,
    innerTextDynamicPath     = '',
    innerTextDynamicSteps    = [],
    innerTextDynamicDateFormat = '',
    innerTextDynamicCommentsNoText = '',
    innerTextDynamicCommentsOneText = '',
    innerTextDynamicCommentsManyText = '',
    sourcePostId             = 0,
    sourcePostType           = '',
    postSource               = 'current',
    target,
    rel,
    referrerPolicy,
  } = attributes;

  const hasDynamicSteps = useMemo(() =>
    Array.isArray(dynamicSteps) && dynamicSteps.some((step) => step?.type || step?.value),
    [dynamicSteps]
  );
  const hasDynamicLabelSteps = useMemo(() =>
    Array.isArray(innerTextDynamicSteps) && innerTextDynamicSteps.some((step) => step?.type || step?.value),
    [innerTextDynamicSteps]
  );

  const isDynamicMode = Boolean(isDynamic || dynamicPath || hasDynamicSteps);
  const isDynamicLabelMode = Boolean(isInnerTextDynamic || innerTextDynamicPath || hasDynamicLabelSteps);
  const resolvedPath = useMemo(() => stepsToPath(dynamicSteps), [dynamicSteps]);
  const resolvedLabelPath = useMemo(() => stepsToPath(innerTextDynamicSteps), [innerTextDynamicSteps]);

  // --- Post / context --------------------------------------------------------
  const editorPostType = useSelect((select) => select('core/editor')?.getCurrentPostType?.() || 'post', []);
  const editorPostId   = useSelect((select) => select('core/editor')?.getCurrentPostId?.()   || 0,      []);
  const contextPostId  = context?.['tmsblocks/contextPostId'] || context?.['tms/contextPostId'] || context?.postId || 0;
  const contextPostType = context?.['tmsblocks/contextPostType'] || context?.['tms/contextPostType'] || context?.postType || '';
  const effectivePostId = postSource === 'specific' ? sourcePostId : (contextPostId || editorPostId);
  const effectivePostType = postSource === 'specific'
    ? (sourcePostType || 'post')
    : (contextPostType || editorPostType);

  // --- Taxonomies ------------------------------------------------------------
  const taxonomies = useSelect((select) => select('core').getTaxonomies({ per_page: -1 }) || [], []);
  const taxonomyOptions = useMemo(() =>
    [{ label: 'Select taxonomy', value: '' }].concat(
      taxonomies.map((tax) => ({ label: tax?.name || tax?.slug, value: tax?.slug }))
    ),
    [taxonomies]
  );

  // --- Derived step flags ----------------------------------------------------
  // --- Shared dynamic data hook ---------------------------------------------
  const {
    previewValues,
    previewError: hrefPreviewError,
    postMetaOptions,
    termMetaOptionsByTax,
    userMetaOptions,
  } = useDynamicField({
    path: isDynamicMode ? (resolvedPath || dynamicPath) : '',
    postId: isDynamicMode ? effectivePostId : 0,
    postType: effectivePostType,
    dateFormat: dynamicDateFormat,
    commentsNoText: dynamicCommentsNoText,
    commentsOneText: dynamicCommentsOneText,
    commentsManyText: dynamicCommentsManyText,
  });
  const hrefPreviewValue = previewValues.length ? String(previewValues[0] ?? '') : '';

  const {
    previewValues: labelPreviewValues,
    previewError: labelPreviewError,
  } = useDynamicField({
    path: isDynamicLabelMode ? (resolvedLabelPath || innerTextDynamicPath) : '',
    postId: isDynamicLabelMode ? effectivePostId : 0,
    postType: effectivePostType,
    dateFormat: innerTextDynamicDateFormat,
    commentsNoText: innerTextDynamicCommentsNoText,
    commentsOneText: innerTextDynamicCommentsOneText,
    commentsManyText: innerTextDynamicCommentsManyText,
  });
  const labelPreviewValue = labelPreviewValues
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ');

  // --- Options ---------------------------------------------------------------
  const targetOptions = [
    { label: 'Same tab (default)', value: '' },
    { label: 'New tab (_blank)',   value: '_blank' },
    { label: 'Parent frame (_parent)', value: '_parent' },
    { label: 'Top frame (_top)',   value: '_top' },
    { label: 'Same frame (_self)', value: '_self' },
  ];
  const REL_VALUES = [
     'author',  
       'license',
    'me', 'next', 'nofollow', 'noopener', 'noreferrer',
    'prev',   
    'search', 'sponsored',   'ugc',
  ];
  const selectedRels = useMemo(() => new Set((rel || '').split(' ').filter(Boolean)), [rel]);
  const toggleRel = (value) => {
    const next = new Set(selectedRels);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setAttributes({ rel: REL_VALUES.filter((v) => next.has(v)).join(' ') });
  };
  const referrerPolicyOptions = [
    { label: 'Default',                             value: '' },
    { label: 'no-referrer',                         value: 'no-referrer' },
    { label: 'no-referrer-when-downgrade',          value: 'no-referrer-when-downgrade' },
    { label: 'origin',                              value: 'origin' },
    { label: 'origin-when-cross-origin',            value: 'origin-when-cross-origin' },
    { label: 'same-origin',                         value: 'same-origin' },
    { label: 'strict-origin',                       value: 'strict-origin' },
    { label: 'strict-origin-when-cross-origin',     value: 'strict-origin-when-cross-origin' },
    { label: 'unsafe-url',                          value: 'unsafe-url' },
  ];

  // --- Render ----------------------------------------------------------------
  return (
    <>
      <ToggleControl
        label="Use dynamic link"
        checked={isDynamicMode}
        onChange={(nextIsDynamic) => {
          if (nextIsDynamic) {
            setAttributes({ isDynamic: true, href: '' });
            return;
          }
          setAttributes({
            isDynamic: false,
            dynamicPath: '',
            dynamicSteps: [],
            dynamicDateFormat: '',
            dynamicCommentsNoText: '',
            dynamicCommentsOneText: '',
            dynamicCommentsManyText: '',
            ...(!isDynamicLabelMode ? {
              sourcePostId: 0,
              sourcePostType: '',
              postSource: 'current',
            } : {}),
          });
        }}
        help={isDynamicMode ? 'Link URL is resolved from dynamic field steps. The visible label is configured separately.' : 'Set a manual URL in Link (href). The visible label is configured separately.'}
      />

      {isDynamicMode ? (
        <>
          <DynamicFieldSettings
            steps={dynamicSteps}
            path={dynamicPath}
            resolvedPath={resolvedPath}
            separator=", "
            emptyText=""
            dateFormat={dynamicDateFormat}
            commentsNoText={dynamicCommentsNoText}
            commentsOneText={dynamicCommentsOneText}
            commentsManyText={dynamicCommentsManyText}
            taxonomyOptions={taxonomyOptions}
            postMetaOptions={postMetaOptions}
            termMetaOptionsByTax={termMetaOptionsByTax}
            userMetaOptions={userMetaOptions}
            onPathChange={(newSteps, newPath) => setAttributes({
              isDynamic: true,
              dynamicSteps: newSteps,
              dynamicPath: newPath,
            })}
            onSeparatorChange={() => {}}
            onEmptyTextChange={() => {}}
            onDateFormatChange={(v) => setAttributes({ dynamicDateFormat: v })}
            onCommentsNoTextChange={(v) => setAttributes({ dynamicCommentsNoText: v })}
            onCommentsOneTextChange={(v) => setAttributes({ dynamicCommentsOneText: v })}
            onCommentsManyTextChange={(v) => setAttributes({ dynamicCommentsManyText: v })}
            showPostSourceControls={isDynamicMode}
            postSource={postSource}
            sourcePostId={sourcePostId}
            sourcePostType={sourcePostType}
            setAttributes={setAttributes}
            showPreview={!!(resolvedPath || dynamicPath)}
            previewLabel="Resolved link value"
            previewValue={hrefPreviewValue || hrefPreviewError || ''}
            previewHelp={hrefPreviewError || 'Preview of first resolved value for current post context.'}
            showValueOptions={false}
          />
        </>
      ) : (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Link (href)" />
          </div>
          <TextControl
            label="LINK (href)"
            hideLabelFromVision
            value={href}
            onChange={(v) => setAttributes({ href: v })}
            help="This sets the URL only. Set the visible label in the block canvas or enable 'Use dynamic label'."
          />
        </>
      )}

      <ToggleControl
        label="Use dynamic label"
        checked={isDynamicLabelMode}
        onChange={(nextIsDynamic) => {
          if (nextIsDynamic) {
            setAttributes({ isInnerTextDynamic: true });
            return;
          }
          setAttributes({
            isInnerTextDynamic: false,
            innerTextDynamicPath: '',
            innerTextDynamicSteps: [],
            innerTextDynamicDateFormat: '',
            innerTextDynamicCommentsNoText: '',
            innerTextDynamicCommentsOneText: '',
            innerTextDynamicCommentsManyText: '',
            ...(!isDynamicMode ? {
              sourcePostId: 0,
              sourcePostType: '',
              postSource: 'current',
            } : {}),
          });
        }}
        help={isDynamicLabelMode ? 'Label text is resolved from dynamic field steps and is never auto-filled from the href.' : 'Turn on to resolve the visible link label dynamically. It is not auto-filled from the href.'}
      />

      {isDynamicLabelMode && (
        <DynamicFieldSettings
          steps={innerTextDynamicSteps}
          path={innerTextDynamicPath}
          resolvedPath={resolvedLabelPath}
          separator=", "
          emptyText=""
          dateFormat={innerTextDynamicDateFormat}
          commentsNoText={innerTextDynamicCommentsNoText}
          commentsOneText={innerTextDynamicCommentsOneText}
          commentsManyText={innerTextDynamicCommentsManyText}
          taxonomyOptions={taxonomyOptions}
          postMetaOptions={postMetaOptions}
          termMetaOptionsByTax={termMetaOptionsByTax}
          userMetaOptions={userMetaOptions}
          onPathChange={(newSteps, newPath) => setAttributes({
            isInnerTextDynamic: true,
            innerTextDynamicSteps: newSteps,
            innerTextDynamicPath: newPath,
          })}
          onSeparatorChange={() => {}}
          onEmptyTextChange={() => {}}
          onDateFormatChange={(v) => setAttributes({ innerTextDynamicDateFormat: v })}
          onCommentsNoTextChange={(v) => setAttributes({ innerTextDynamicCommentsNoText: v })}
          onCommentsOneTextChange={(v) => setAttributes({ innerTextDynamicCommentsOneText: v })}
          onCommentsManyTextChange={(v) => setAttributes({ innerTextDynamicCommentsManyText: v })}
          showPostSourceControls={!isDynamicMode}
          postSource={postSource}
          sourcePostId={sourcePostId}
          sourcePostType={sourcePostType}
          setAttributes={setAttributes}
          showPreview={!!(resolvedLabelPath || innerTextDynamicPath)}
          previewLabel="Resolved label value"
          previewValue={labelPreviewValue || labelPreviewError || ''}
          previewHelp={labelPreviewError || 'Preview of resolved label text for current post context.'}
          showValueOptions={false}
        />
      )}

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Target" />
      </div>
      <SelectControl label="Target" hideLabelFromVision value={target} options={targetOptions} onChange={(v) => setAttributes({ target: v })} />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="REL" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 8px', marginBottom: rel ? '4px' : '16px' }}>
        {REL_VALUES.map((value) => (
          <CheckboxControl
            key={value}
            label={value}
            checked={selectedRels.has(value)}
            onChange={() => toggleRel(value)}
          />
        ))}
      </div>
      {rel && (
        <p style={{ fontSize: '11px', color: '#757575', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: 0, marginBottom: '16px' }}>
          {rel}
        </p>
      )}

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Referrer Policy" />
      </div>
      <SelectControl label="Referrer Policy" hideLabelFromVision value={referrerPolicy} options={referrerPolicyOptions} onChange={(v) => setAttributes({ referrerPolicy: v })} />
    </>
  );
}

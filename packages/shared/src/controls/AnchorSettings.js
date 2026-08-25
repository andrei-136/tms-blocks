import React, { useMemo, useState, useEffect } from 'react';
import { TextControl, SelectControl, CheckboxControl, ToggleControl, Button, ButtonGroup, ComboboxControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
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

const stripHtml = (str) => {
  if (!str) return '';
  // Use DOM parser to safely strip HTML tags
  const doc = new DOMParser().parseFromString(str, 'text/html');
  return doc.body.textContent || '';
};

export default function AnchorSettings({ attributes, setAttributes, context = {}, masterAttributes = null }) {
  const {
    href                     = '',
    linkSource: linkSourceAttr,
    linkId                   = 0,
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

  // Derive linkSource — new attr wins, old isDynamic is fallback for saved blocks
  const linkSource = linkSourceAttr || (isDynamic ? 'dynamic' : 'url');
  const isDynamicMode = linkSource === 'dynamic';
  const isPostMode = linkSource === 'post';
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

  // --- Post/Page picker -----------------------------------------------------
  const [postSearch, setPostSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input to avoid flooding the REST API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(postSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [postSearch]);

  // Post/Page results via apiFetch — same pattern as PostSearchSelector's
  // usePostSearch. No explicit status => REST default (publish only), so
  // drafts are hidden and only content the current user can read is returned.
  const [postResults, setPostResults] = useState([]);

  useEffect(() => {
    if (!isPostMode) { setPostResults([]); return; }
    let active = true;
    const searchTerm = debouncedSearch || '';
    const q = `per_page=20${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}`;
    Promise.allSettled([
      apiFetch({ path: `/wp/v2/pages?${q}` }),
      apiFetch({ path: `/wp/v2/posts?${q}` }),
    ]).then(([pagesRes, postsRes]) => {
        if (!active) return;
        if (pagesRes.status === 'rejected') {
          // eslint-disable-next-line no-console
          console.warn('TMS Link: pages search failed', pagesRes.reason);
        }
        const pages = pagesRes.status === 'fulfilled' && Array.isArray(pagesRes.value) ? pagesRes.value : [];
        const posts = postsRes.status === 'fulfilled' && Array.isArray(postsRes.value) ? postsRes.value : [];
        const all = [...pages, ...posts].sort((a, b) => {
          const titleA = (stripHtml(a.title?.raw) || stripHtml(a.title?.rendered) || '').toLowerCase();
          const titleB = (stripHtml(b.title?.raw) || stripHtml(b.title?.rendered) || '').toLowerCase();
          return titleA.localeCompare(titleB);
        });
        setPostResults(all);
    });
    return () => { active = false; };
  }, [isPostMode, debouncedSearch]);

  const postOptions = useMemo(() =>
    postResults.map((p) => ({
      value: p.id,
      label: stripHtml(p.title?.raw) || stripHtml(p.title?.rendered) || `#${p.id} (${p.type})`,
    })),
    [postResults]
  );

  const selectedPost = useSelect((select) => {
    if (!linkId || !isPostMode) return null;
    // Try 'page' first, then 'post' — IDs are shared across post types in WP
    return select('core').getEntityRecord('postType', 'page', linkId)
      || select('core').getEntityRecord('postType', 'post', linkId)
      || null;
  }, [linkId, isPostMode]);

  const resolvedLinkIdHref = useMemo(() => {
    if (!selectedPost) return '';
    return selectedPost.link || '';
  }, [selectedPost]);

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

  // --- Wrapper-property dots ----------------------------------------------
  // Same convention as the other wrapper controls: NO dot on standalone; on an
  // instance, no dot when both are at the default, purple when the instance
  // matches the master, orange when overridden.
  const wrapperLevel = (inst, def, master) =>
    masterAttributes ? (inst === def && master === def ? 0 : (inst === master ? 2 : 3)) : 0;

  const linkSourceDot       = wrapperLevel(linkSource, 'url', masterAttributes?.linkSource ?? 'url');
  const linkIdDot           = wrapperLevel(linkId || 0, 0, masterAttributes?.linkId ?? 0);
  const hrefDot             = wrapperLevel(href, '', masterAttributes?.href ?? '');
  const targetDot           = wrapperLevel(target || '', '', masterAttributes?.target ?? '');
  const relDot              = wrapperLevel(rel || '', '', masterAttributes?.rel ?? '');
  const referrerPolicyDot   = wrapperLevel(referrerPolicy || '', '', masterAttributes?.referrerPolicy ?? '');

  // Dynamic-label toggle — mirrors the paragraph/heading dynamicLevel rule.
  const dynamicLabelDot = masterAttributes
    ? (isDynamicLabelMode === false && !(masterAttributes.isInnerTextDynamic || false)
        ? 0
        : (isDynamicLabelMode === (masterAttributes.isInnerTextDynamic || false) ? 2 : 3))
    : 0;

  // --- Render ----------------------------------------------------------------
  return (
    <>
      {/* --- Link source selector ------------------------------------------- */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Link source" level={linkSourceDot} />
      </div>
      <ButtonGroup style={{ width: '100%', display: 'flex', marginBottom: '12px' }}>
        <Button
          variant={linkSource === 'url' ? 'primary' : 'secondary'}
          onClick={() => setAttributes({ linkSource: 'url', isDynamic: false })}
          style={{ flex: 1 }}
        >
          URL
        </Button>
        <Button
          variant={isPostMode ? 'primary' : 'secondary'}
          onClick={() => setAttributes({ linkSource: 'post', linkId: linkId || 0, isDynamic: false })}
          style={{ flex: 1 }}
        >
          Post/Page
        </Button>
        <Button
          variant={isDynamicMode ? 'primary' : 'secondary'}
          onClick={() => setAttributes({ linkSource: 'dynamic', isDynamic: true, href: '' })}
          style={{ flex: 1 }}
        >
          Dynamic
        </Button>
      </ButtonGroup>

      {/* --- Post/Page mode -------------------------------------------------- */}
      {isPostMode && (
        <>
          <ComboboxControl
            label={<ControlLabel label="Post/Page" level={linkIdDot} />}
            value={linkId || undefined}
            options={postOptions}
            onInputChange={setPostSearch}
            onChange={(val) => setAttributes({ linkId: val ? Number(val) : 0 })}
            help="Search for a page or post to link to."
          />
          {linkId > 0 && resolvedLinkIdHref && (
            <p style={{ fontSize: '11px', color: '#757575', marginTop: '4px', wordBreak: 'break-all' }}>
              Resolves to: {resolvedLinkIdHref}
            </p>
          )}
          {linkId > 0 && !resolvedLinkIdHref && (
            <p style={{ fontSize: '11px', color: '#cc1818', marginTop: '4px' }}>
              Could not resolve permalink for ID #{linkId}. The post may have been deleted.
            </p>
          )}
        </>
      )}

      {/* --- Dynamic mode ---------------------------------------------------- */}
      {isDynamicMode && (
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
            showPostSourceControls={true}
            postSource={postSource}
            sourcePostId={sourcePostId}
            sourcePostType={sourcePostType}
            setAttributes={setAttributes}
            showPreview={!!(resolvedPath || dynamicPath)}
            previewLabel="Resolved link value"
            previewValue={hrefPreviewValue || hrefPreviewError || ''}
            previewHelp={hrefPreviewError || 'Preview of first resolved value for current post context.'}
            showValueOptions={false}
            masterAttributes={masterAttributes}
          />
        </>
      )}

      {/* --- URL mode -------------------------------------------------------- */}
      {linkSource === 'url' && !isPostMode && !isDynamicMode && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Link (href)" level={hrefDot} />
          </div>
          <TextControl
            label="LINK (href)"
            hideLabelFromVision
            value={href}
            onChange={(v) => setAttributes({ href: v })}
            help="This sets the URL only. Set the visible label in the block canvas or enable 'Use dynamic label' below."
          />
        </>
      )}

      <ToggleControl
        label={<ControlLabel label="Use dynamic label" level={dynamicLabelDot} />}
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
            ...(linkSource !== 'dynamic' ? {
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
          showPostSourceControls={linkSource !== 'dynamic'}
          postSource={postSource}
          sourcePostId={sourcePostId}
          sourcePostType={sourcePostType}
          setAttributes={setAttributes}
          showPreview={!!(resolvedLabelPath || innerTextDynamicPath)}
          previewLabel="Resolved label value"
          previewValue={labelPreviewValue || labelPreviewError || ''}
          previewHelp={labelPreviewError || 'Preview of resolved label text for current post context.'}
          showValueOptions={false}
          masterAttributes={masterAttributes}
          masterPathKey="innerTextDynamicPath"
        />
      )}

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Target" level={targetDot} />
      </div>
      <SelectControl label="Target" hideLabelFromVision value={target} options={targetOptions} onChange={(v) => setAttributes({ target: v })} />

      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="REL" level={relDot} />
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
        <ControlLabel label="Referrer Policy" level={referrerPolicyDot} />
      </div>
      <SelectControl label="Referrer Policy" hideLabelFromVision value={referrerPolicy} options={referrerPolicyOptions} onChange={(v) => setAttributes({ referrerPolicy: v })} />
    </>
  );
}

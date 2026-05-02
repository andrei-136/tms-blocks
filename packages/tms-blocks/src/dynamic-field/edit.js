import React, { useMemo, useCallback, useState } from 'react';
import {
  useBlockProps,
  InspectorControls,
  useStyleOverride,
  store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
  Button,
  PanelBody,
  RangeControl,
  SelectControl,
  TabPanel,
  TextControl,
  ToggleControl,
  Notice,
} from '@wordpress/components';
import StyleControls from '../../../shared/src/controls/StyleControls';
import BreakpointSelector from '../../../shared/src/controls/BreakpointSelector';

import DynamicFieldSettings from '../../../shared/src/controls/DynamicFieldSettings';
import DynamicFieldStepBuilder from '../../../shared/src/controls/DynamicFieldStepBuilder';
import useCustomStyle from '../../../shared/src/hooks/useCustomStyle';
import useDynamicField from '../../../shared/src/hooks/useDynamicField';
import useUniqueId from '../../../shared/src/hooks/useUniqueId';
import useBreakpointStyles from '../../../shared/src/hooks/useBreakpointStyles';
import { customStyleToInlineStyle, customStyleToCSSString, hasModifiedStyleProps } from '../../../shared/src/style-utils';
import IdentityControls from '../../../shared/src/controls/IdentityControls';
import TagControls from '../../../shared/src/controls/TagControls';
import AriaControls from '../../../shared/src/controls/AriaControls';
import CustomAttributesControls from '../../../shared/src/controls/CustomAttributesControls';
import ClassNameControl from '../../../shared/src/controls/ClassNameControl';
import TransitionControls, { DEFAULT_GLOBAL as DEFAULT_TRANSITION_GLOBAL } from '../../../shared/src/controls/TransitionControls';
import ControlLabel from '../../../shared/src/controls/ControlLabel';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';
import { DYNAMIC_FIELD_PRESETS } from './presets';

// -- Constants ----------------------------------------------------------------

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

const ITEM_TYPES = [
  { label: 'Text',       value: 'text'  },
  { label: 'Image',      value: 'image' },
  { label: 'URL / Link', value: 'url'   },
];

const DEFAULT_ITEM_TAG = {
  text:  'span',
  image: 'img',
  url:   'a',
};

const ITEM_STYLE_INCLUDE = {
  text:  ['Typography', 'Color', 'Background', 'Border', 'Spacing', 'Dimension', 'Effects', 'Display', 'FlexItem', 'GridItem', 'Position'],
  image: ['Dimension', 'Border', 'Effects', 'Object', 'Display', 'FlexItem', 'GridItem', 'Position', 'Spacing'],
  url:   ['Typography', 'Color', 'Background', 'Border', 'Spacing', 'Dimension', 'Effects', 'Display', 'FlexItem', 'GridItem', 'Position'],
};

const DEFAULT_PREVIEW_LIMIT = 5;

const SAMPLE_VALUES = {
  text:  'Sample text',
  image: 'https://placehold.co/120x80/e0e0e0/888?text=img',
  url:   '#',
};

const SAMPLE_LINK_TEXT = 'Sample link';

// -- Shared style hook --------------------------------------------------------

function useCanvasStyles({
  uniqueId, clientId,
  customStyle, itemStyle, itemStyleHover, itemStyleFocusVisible,
  responsiveStyle, itemResponsiveStyle,
  breakpointOverrides, customBreakpoints,
}) {
  const uniqueClassName = uniqueId ? `tmsblocks-dynamic-field-${uniqueId}` : '';

  const containerCss        = useMemo(() => customStyleToCSSString(customStyle),           [customStyle]);
  const itemCss             = useMemo(() => customStyleToCSSString(itemStyle),             [itemStyle]);
  const itemCssHover        = useMemo(() => customStyleToCSSString(itemStyleHover),        [itemStyleHover]);
  const itemCssFocusVisible = useMemo(() => customStyleToCSSString(itemStyleFocusVisible), [itemStyleFocusVisible]);

  const containerResponsiveCss = useMemo(() => {
    if (!uniqueClassName) return '';
    const resolved = resolveBreakpoints(
      breakpointOverrides,
      Object.keys(responsiveStyle || {}),
      customBreakpoints
    );
    return resolved.map(({ key, maxWidth }) => {
      const base = customStyleToCSSString(responsiveStyle?.[key]?.base || {});
      return base
        ? `@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClassName} { ${base} } }`
        : '';
    }).filter(Boolean).join('\n');
  }, [uniqueClassName, responsiveStyle, breakpointOverrides, customBreakpoints]);

  const itemResponsiveCss = useMemo(() => {
    if (!uniqueClassName) return '';
    const resolved = resolveBreakpoints(
      breakpointOverrides,
      Object.keys(itemResponsiveStyle || {}),
      customBreakpoints
    );
    const sel = `.editor-styles-wrapper .${uniqueClassName} [data-tmsblocks-preview-item]`;
    return resolved.map(({ key, maxWidth }) => {
      const base  = customStyleToCSSString(itemResponsiveStyle?.[key]?.base         || {});
      const hover = customStyleToCSSString(itemResponsiveStyle?.[key]?.hover        || {});
      const focus = customStyleToCSSString(itemResponsiveStyle?.[key]?.focusVisible || {});
      const lines = [];
      if (base)  lines.push(`@media (max-width: ${maxWidth}px) { ${sel} { ${base} } }`);
      if (hover) lines.push(`@media (max-width: ${maxWidth}px) { ${sel}:hover { ${hover} } }`);
      if (focus) lines.push(`@media (max-width: ${maxWidth}px) { ${sel}:focus-visible { ${focus} } }`);
      return lines.join('\n');
    }).filter(Boolean).join('\n');
  }, [uniqueClassName, itemResponsiveStyle, breakpointOverrides, customBreakpoints]);

  useStyleOverride({
    id:  `tmsblocks-df-container-${clientId}`,
    css: uniqueClassName
      ? [
          containerCss ? `.editor-styles-wrapper .${uniqueClassName} { ${containerCss} }` : '',
          containerResponsiveCss,
        ].filter(Boolean).join('\n')
      : '',
  });

  useStyleOverride({
    id:  `tmsblocks-df-item-${clientId}`,
    css: uniqueClassName
      ? [
          itemCss             ? `.editor-styles-wrapper .${uniqueClassName} [data-tmsblocks-preview-item] { ${itemCss} }`                           : '',
          itemCssHover        ? `.editor-styles-wrapper .${uniqueClassName} [data-tmsblocks-preview-item]:hover { ${itemCssHover} }`                : '',
          itemCssFocusVisible ? `.editor-styles-wrapper .${uniqueClassName} [data-tmsblocks-preview-item]:focus-visible { ${itemCssFocusVisible} }` : '',
          itemResponsiveCss,
        ].filter(Boolean).join('\n')
      : '',
  });

  return uniqueClassName;
}

// -- Canvas item renderer -----------------------------------------------------

function CanvasItems({
  valuesToShow, isSample, itemType, itemTagName, itemClassName, itemStyle,
  hrefSource, staticHref, hrefValues, linkLabelMode, linkText, linkTextValues,
  linkTarget, separator,
}) {
  const ItemTag         = itemTagName || DEFAULT_ITEM_TAG[itemType] || 'span';
  const itemInlineStyle = useMemo(() => customStyleToInlineStyle(itemStyle), [itemStyle]);
  const shouldRenderSeparator = typeof separator === 'string' ? separator !== '' : !!separator;

  const resolveHref = (value, index) => {
    if (isSample) return '#';
    if (hrefSource === 'static') return staticHref || '#';
    if (hrefSource === 'path')   return hrefValues[index] || '#';
    return value;
  };

  const resolveLabel = (value, index) => {
    if (hrefSource === 'path') return value || SAMPLE_LINK_TEXT;
    if (linkLabelMode === 'static') return linkText || value || SAMPLE_LINK_TEXT;
    return linkTextValues[index] || linkText || value || SAMPLE_LINK_TEXT;
  };

  return valuesToShow.map((value, index) => {
    const commonProps = {
      style:                         itemInlineStyle,
      className:                     itemClassName || undefined,
      'data-tmsblocks-preview-item': true,
    };

    let item;
    if (itemType === 'image') {
      item = <img key={index} src={value} alt="" {...commonProps} />;
    } else if (itemType === 'url') {
      item = (
        <a
          key={index}
          href={resolveHref(value, index)}
          target={linkTarget}
          rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={(e) => e.preventDefault()}
          {...commonProps}
        >
          {resolveLabel(value, index)}
        </a>
      );
    } else {
      item = <ItemTag key={index} {...commonProps}>{value}</ItemTag>;
    }

    return (
      <React.Fragment key={`${value}-${index}`}>
        {item}
        {index < valuesToShow.length - 1 && shouldRenderSeparator && (
          <span className="tmsblocks-dynamic-field-separator" aria-hidden="true">{separator}</span>
        )}
      </React.Fragment>
    );
  });
}

// -- URL item settings panel --------------------------------------------------

function UrlItemSettings({
  hrefSource, staticHref, hrefSteps, hrefPath, resolvedHrefPath,
  hrefPreviewValue, resolvedPreviewValue,
  linkLabelMode, linkText, linkTextSteps, linkTextPath, resolvedLinkTextPath,
  linkTextValues, linkTarget,
  taxonomyOptions, postMetaOptions, termMetaOptionsByTax, userMetaOptions,
  setAttributes,
}) {
  const handleHrefStepUpdate   = (i, patch) => { const next = hrefSteps.map((s, idx) => idx !== i ? s : { ...s, ...patch }); setAttributes({ hrefSteps: next, hrefPath: stepsToPath(next) }); };
  const handleHrefStepAdd      = ()         => { const next = [...hrefSteps, { type: '', value: '' }]; setAttributes({ hrefSteps: next, hrefPath: stepsToPath(next) }); };
  const handleHrefStepRemove   = (i)        => { const next = hrefSteps.filter((_, idx) => idx !== i); setAttributes({ hrefSteps: next, hrefPath: stepsToPath(next) }); };
  const getHrefTaxonomyForStep = (i)        => { for (let j = i - 1; j >= 0; j--) { if (hrefSteps[j]?.type === 'terms' && hrefSteps[j].value) return hrefSteps[j].value; } return ''; };

  const handleLinkTextStepUpdate   = (i, patch) => { const next = linkTextSteps.map((s, idx) => idx !== i ? s : { ...s, ...patch }); setAttributes({ linkTextSteps: next, linkTextPath: stepsToPath(next) }); };
  const handleLinkTextStepAdd      = ()         => { const next = [...linkTextSteps, { type: '', value: '' }]; setAttributes({ linkTextSteps: next, linkTextPath: stepsToPath(next) }); };
  const handleLinkTextStepRemove   = (i)        => { const next = linkTextSteps.filter((_, idx) => idx !== i); setAttributes({ linkTextSteps: next, linkTextPath: stepsToPath(next) }); };
  const getLinkTextTaxonomyForStep = (i)        => { for (let j = i - 1; j >= 0; j--) { if (linkTextSteps[j]?.type === 'terms' && linkTextSteps[j].value) return linkTextSteps[j].value; } return ''; };

  const sectionLabel = { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1e1e1e', display: 'block', marginBottom: '8px', marginTop: '4px' };
  const divider      = { borderTop: '1px solid var(--tmsblocks-border, #d6d0f0)', margin: '12px 0' };
  const previewStyle = { fontSize: '11px', color: '#555', margin: '4px 0 0', fontStyle: 'italic', wordBreak: 'break-all' };
  const labelPreviewValue = linkLabelMode === 'static' ? (linkText || resolvedPreviewValue || '') : (linkTextValues[0] || linkText || resolvedPreviewValue || '');

  return (
    <>
      <span style={sectionLabel}>Link URL (href)</span>
      <SelectControl
        label="href source"
        value={hrefSource}
        options={[
          { label: 'Field value is the URL', value: 'field'  },
          { label: 'URL from a different field',    value: 'path'   },
          { label: 'Same URL for every item',       value: 'static' },
        ]}
        onChange={(v) => setAttributes({ hrefSource: v })}
        
      />
      {hrefSource === 'static' && (
        <TextControl label={<ControlLabel label="Static href" isSet={!!staticHref} />} value={staticHref} onChange={(v) => setAttributes({ staticHref: v })} placeholder="https://example.com" />
      )}
      {hrefSource === 'path' && (
        <>
          <DynamicFieldStepBuilder
            steps={hrefSteps}
            taxonomyOptions={taxonomyOptions} postMetaOptions={postMetaOptions}
            termMetaOptionsByTax={termMetaOptionsByTax} userMetaOptions={userMetaOptions}
            onUpdateStep={handleHrefStepUpdate} onAddStep={handleHrefStepAdd} onRemoveStep={handleHrefStepRemove}
            onPathChange={(newSteps, newPath) => setAttributes({ hrefSteps: newSteps, hrefPath: newPath })}
            getTaxonomyForStep={getHrefTaxonomyForStep}
            label="href field path"
            help="Resolved independently from the main field."
          />
          {hrefPreviewValue && <p style={previewStyle}>Preview: <code>{hrefPreviewValue}</code></p>}
        </>
      )}
      {hrefSource === 'field' && resolvedPreviewValue && (
        <p style={previewStyle}>Preview: <code>{resolvedPreviewValue}</code></p>
      )}
      <div style={divider} />
      {(hrefSource === 'field' || hrefSource === 'static') && (
        <>
          <span style={sectionLabel}>Link label</span>
          <SelectControl
            label="Label source"
            value={linkLabelMode}
            options={[
              { label: 'Static - same text for all links', value: 'static'  },
              { label: 'Dynamic - resolved per link',       value: 'dynamic' },
            ]}
            onChange={(v) => setAttributes({ linkLabelMode: v })}
            help={
              linkLabelMode === 'static'  ? 'Falls back to the field value if label text is empty.'
              : hrefSource === 'field'    ? 'Falls back to raw URL if no label is resolved.'
              : 'Falls back to static href if no label is resolved.'
            }
          />
          {linkLabelMode === 'static' && (
            <TextControl label={<ControlLabel label="Label text" isSet={!!linkText} />} value={linkText} onChange={(v) => setAttributes({ linkText: v })} placeholder='"Read more"' />
          )}
          {linkLabelMode === 'dynamic' && (
            <DynamicFieldStepBuilder
              steps={linkTextSteps}
              taxonomyOptions={taxonomyOptions} postMetaOptions={postMetaOptions}
              termMetaOptionsByTax={termMetaOptionsByTax} userMetaOptions={userMetaOptions}
              onUpdateStep={handleLinkTextStepUpdate} onAddStep={handleLinkTextStepAdd} onRemoveStep={handleLinkTextStepRemove}
              onPathChange={(newSteps, newPath) => setAttributes({ linkTextSteps: newSteps, linkTextPath: newPath })}
              getTaxonomyForStep={getLinkTextTaxonomyForStep}
              label="Label field path"
            />
          )}
          {!!labelPreviewValue && <p style={previewStyle}>Preview: {labelPreviewValue}</p>}
          <div style={divider} />
        </>
      )}
      {hrefSource === 'path' && (
        <p style={previewStyle}>Field value (e.g. term name) is used as the link label automatically.</p>
      )}
      <SelectControl
        label="Open in"
        value={linkTarget}
        options={[{ label: 'Same tab', value: '_self' }, { label: 'New tab', value: '_blank' }]}
        onChange={(v) => setAttributes({ linkTarget: v })}
      />
    </>
  );
}

// -- EditCanvas ---------------------------------------------------------------

function EditCanvas({ attributes, setAttributes, clientId, context }) {
  const {
    steps                 = [],
    path                  = '',
    previewLimit          = DEFAULT_PREVIEW_LIMIT,
    uniqueId,
    customStyle           = {},
    itemStyle             = {},
    itemStyleHover        = {},
    itemStyleFocusVisible = {},
    responsiveStyle       = {},
    itemResponsiveStyle   = {},
    breakpointOverrides   = {},
    customBreakpoints     = [],
    tmsClassName          = '',
    itemType              = 'text',
    itemTagName           = 'span',
    itemClassName         = '',
    hrefSource            = 'field',
    staticHref            = '',
    hrefPath              = '',
    hrefSteps             = [],
    linkLabelMode         = 'dynamic',
    linkText              = '',
    linkTextPath          = '',
    linkTextSteps         = [],
    linkTarget            = '_self',
    separator             = ', ',
    renderBlock           = true,
    dateFormat            = '',
    commentsNoText        = '',
    commentsOneText       = '',
    commentsManyText      = '',
    sourcePostId          = 0,
    sourcePostType        = '',
    postSource            = 'current',
  } = attributes;

  const editorPostType = useSelect((select) => select('core/editor')?.getCurrentPostType?.() || 'post', []);
  const editorPostId   = useSelect((select) => select('core/editor')?.getCurrentPostId?.()   || 0,      []);

  const currentPostType = postSource === 'specific'
    ? (sourcePostType || 'post')
    : (context?.['tmsblocks/contextPostType'] || context?.['tms/contextPostType'] || context?.postType || editorPostType);
  const currentPostId = postSource === 'specific'
    ? sourcePostId
    : (context?.['tmsblocks/contextPostId'] || context?.['tms/contextPostId'] || context?.postId || editorPostId);

  const resolvedPath         = useMemo(() => stepsToPath(steps),         [steps]);
  const resolvedHrefPath     = useMemo(() => stepsToPath(hrefSteps),     [hrefSteps]);
  const resolvedLinkTextPath = useMemo(() => stepsToPath(linkTextSteps), [linkTextSteps]);
  const previewPath          = resolvedPath || path;

  const {
    previewValues,
    previewError,
  } = useDynamicField({
    path: renderBlock ? previewPath : '',
    postId: currentPostId,
    postType: currentPostType,
    dateFormat,
    commentsNoText,
    commentsOneText,
    commentsManyText,
  });

  const { previewValues: hrefPreviewValues } = useDynamicField({
    path: renderBlock && itemType === 'url' && hrefSource === 'path' ? (resolvedHrefPath || hrefPath) : '',
    postId: currentPostId,
    postType: currentPostType,
    dateFormat: '',
    commentsNoText: '',
    commentsOneText: '',
    commentsManyText: '',
  });

  const { previewValues: linkTextValues } = useDynamicField({
    path: renderBlock && itemType === 'url' && hrefSource !== 'path' && linkLabelMode === 'dynamic'
      ? (resolvedLinkTextPath || linkTextPath)
      : '',
    postId: currentPostId,
    postType: currentPostType,
    dateFormat: '',
    commentsNoText: '',
    commentsOneText: '',
    commentsManyText: '',
  });

  const isSample = previewValues.length === 0;
  const valuesToShow = isSample
    ? [SAMPLE_VALUES[itemType]]
    : previewValues.slice(0, previewLimit);

  const uniqueClassName        = useCanvasStyles({ uniqueId, clientId, customStyle, itemStyle, itemStyleHover, itemStyleFocusVisible, responsiveStyle, itemResponsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedContainerClass = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();
  const containerInlineStyle   = useMemo(() => customStyleToInlineStyle(customStyle), [customStyle]);
  const blockProps             = useBlockProps({ className: combinedContainerClass || undefined, style: containerInlineStyle });

  return (
    <div {...blockProps}>
      {!renderBlock && <span style={{ color: '#666', fontSize: '11px' }}>Render Block is disabled. This block will not render on the frontend.</span>}
      {renderBlock && previewError && <span style={{ color: '#c0392b', fontSize: '11px' }}>{previewError}</span>}
      {renderBlock && (
        <CanvasItems
          valuesToShow={valuesToShow} isSample={isSample}
          itemType={itemType} itemTagName={itemTagName} itemClassName={itemClassName} itemStyle={itemStyle}
          hrefSource={hrefSource} staticHref={staticHref} hrefValues={hrefPreviewValues}
          linkLabelMode={linkLabelMode} linkText={linkText} linkTextValues={linkTextValues}
          linkTarget={linkTarget} separator={separator}
        />
      )}
      <br />
    </div>
  );
}

// -- FieldPresetSelector ------------------------------------------------------

function FieldPresetSelector({ taxonomyOptions, onApply }) {
  const [selectedValue, setSelectedValue] = useState('');
  const [taxonomyParam,  setTaxonomyParam]  = useState('');

  const preset = DYNAMIC_FIELD_PRESETS.find((p) => p.value === selectedValue);

  const handleSelect = (value) => {
    setSelectedValue(value);
    setTaxonomyParam('');
  };

  const handleApply = () => {
    if (!selectedValue || !preset) return;
    const taxonomy = preset.param === 'taxonomy' ? taxonomyParam : null;
    onApply({ ...preset.apply(taxonomy), activePreset: selectedValue });
    setSelectedValue('');
    setTaxonomyParam('');
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <SelectControl
        label="Quick setup"
        value={selectedValue}
        options={[{ label: '- Choose a preset -', value: '' }, ...DYNAMIC_FIELD_PRESETS.map((p) => ({ label: p.label, value: p.value }))]}
        onChange={handleSelect}
        help={preset?.description || 'Choose a preset to configure the field path automatically.'}
      />
      {preset?.param === 'taxonomy' && (
        <SelectControl label="Taxonomy" value={taxonomyParam} options={taxonomyOptions} onChange={(v) => setTaxonomyParam(v)} />
      )}
      {selectedValue && (
        <Button
          variant="primary"
          isSmall
          onClick={handleApply}
          disabled={preset?.param === 'taxonomy' && !taxonomyParam}
          style={{ marginTop: '4px' }}
        >
          Apply
        </Button>
      )}
    </div>
  );
}

// -- EditSelected -------------------------------------------------------------

function EditSelected({ attributes, setAttributes, clientId, context }) {
  const {
    steps                 = [],
    path                  = '',
    separator             = ', ',
    emptyText             = '',
    previewLimit          = DEFAULT_PREVIEW_LIMIT,
    itemType              = 'text',
    itemStyle             = {},
    itemStyleHover        = {},
    itemStyleFocusVisible = {},
    itemTransitionConfig  = {},
    itemTagName           = 'span',
    itemClassName         = '',
    hrefSource            = 'field',
    staticHref            = '',
    hrefPath              = '',
    hrefSteps             = [],
    linkLabelMode         = 'dynamic',
    linkText              = '',
    linkTextPath          = '',
    linkTextSteps         = [],
    linkTarget            = '_self',
    uniqueId,
    customStyle           = {},
    responsiveStyle       = {},
    itemResponsiveStyle   = {},
    breakpointOverrides   = {},
    customBreakpoints     = [],
    tmsClassName          = '',
    tagName               = 'div',
    renderBlock           = true,
    dateFormat            = '',
    commentsNoText        = '',
    commentsOneText       = '',
    commentsManyText      = '',
    sourcePostId          = 0,
    sourcePostType        = '',
    postSource            = 'current',
    activePreset          = '',
  } = attributes;

  // -- Post context -----------------------------------------------------------

  const editorPostType = useSelect((select) => select('core/editor')?.getCurrentPostType?.() || 'post', []);
  const editorPostId   = useSelect((select) => select('core/editor')?.getCurrentPostId?.()   || 0,      []);

  const currentPostType = postSource === 'specific'
    ? (sourcePostType || 'post')
    : (context?.['tmsblocks/contextPostType'] || context?.['tms/contextPostType'] || context?.postType || editorPostType);
  const currentPostId = postSource === 'specific'
    ? sourcePostId
    : (context?.['tmsblocks/contextPostId'] || context?.['tms/contextPostId'] || context?.postId || editorPostId);

  // -- Taxonomies -------------------------------------------------------------

  const taxonomies = useSelect((select) => select('core').getTaxonomies({ per_page: -1 }) || [], []);
  const taxonomyOptions = useMemo(() =>
    [{ label: 'Select taxonomy', value: '' }].concat(
      taxonomies.map((t) => ({ label: t?.name || t?.slug, value: t?.slug }))
    ),
    [taxonomies]
  );

  // -- Resolved paths ---------------------------------------------------------

  const resolvedPath         = useMemo(() => stepsToPath(steps),         [steps]);
  const resolvedHrefPath     = useMemo(() => stepsToPath(hrefSteps),     [hrefSteps]);
  const resolvedLinkTextPath = useMemo(() => stepsToPath(linkTextSteps), [linkTextSteps]);
  const previewPath          = resolvedPath || path;

  // -- Dynamic field data -----------------------------------------------------

  const {
    previewValues,
    previewValue: resolvedPreviewValue,
    previewError,
    postMetaOptions,
    termMetaOptionsByTax,
    userMetaOptions,
  } = useDynamicField({
    path: previewPath,
    postId: currentPostId,
    postType: currentPostType,
    dateFormat, commentsNoText, commentsOneText, commentsManyText,
  });

  const { previewValues: hrefPreviewValues } = useDynamicField({
    path: itemType === 'url' && hrefSource === 'path' ? (resolvedHrefPath || hrefPath) : '',
    postId: currentPostId, postType: currentPostType,
    dateFormat: '', commentsNoText: '', commentsOneText: '', commentsManyText: '',
  });
  const hrefPreviewValue = hrefPreviewValues[0] || '';

  const { previewValues: linkTextValues } = useDynamicField({
    path: itemType === 'url' && hrefSource !== 'path' && linkLabelMode === 'dynamic'
      ? (resolvedLinkTextPath || linkTextPath)
      : '',
    postId: currentPostId, postType: currentPostType,
    dateFormat: '', commentsNoText: '', commentsOneText: '', commentsManyText: '',
  });

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle           = useCustomStyle(customStyle,           setAttributes);
  const updateItemStyle             = useCustomStyle(itemStyle,             setAttributes, 'itemStyle');
  const updateItemStyleHover        = useCustomStyle(itemStyleHover,        setAttributes, 'itemStyleHover');
  const updateItemStyleFocusVisible = useCustomStyle(itemStyleFocusVisible, setAttributes, 'itemStyleFocusVisible');
  const setItemTransitionConfig     = useCallback((next) => setAttributes({ itemTransitionConfig: next }), [setAttributes]);
  const handleItemTypeChange        = useCallback(
    (nextType) => setAttributes({ itemType: nextType, itemTagName: DEFAULT_ITEM_TAG[nextType] || 'span' }),
    [setAttributes]
  );

  // Container responsive
  const { getUpdater: getContainerUpdater, getStyle: getContainerStyle } = useBreakpointStyles(responsiveStyle, setAttributes);

  // Item responsive � proxy setAttributes to write to 'itemResponsiveStyle' instead of 'responsiveStyle'
  const setItemResponsiveAttributes = useCallback((patch) => {
    if (patch && 'responsiveStyle' in patch) {
      setAttributes({ itemResponsiveStyle: patch.responsiveStyle });
    } else {
      setAttributes(patch);
    }
  }, [setAttributes]);
  const { getUpdater: getItemUpdater, getStyle: getItemStyle } = useBreakpointStyles(
    itemResponsiveStyle,
    setItemResponsiveAttributes
  );

  // -- Breakpoint state -------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

  const allBreakpoints = useMemo(() =>
    resolveBreakpoints(
      breakpointOverrides,
      [...Object.keys(responsiveStyle || {}), ...Object.keys(itemResponsiveStyle || {})],
      customBreakpoints
    ),
    [breakpointOverrides, responsiveStyle, itemResponsiveStyle, customBreakpoints]
  );

  // -- Modified indicators ----------------------------------------------------

  const itemBaseKeys         = useMemo(() => Object.keys(itemStyle             || {}), [itemStyle]);
  const itemHoverKeys        = useMemo(() => Object.keys(itemStyleHover        || {}), [itemStyleHover]);
  const itemFocusVisibleKeys = useMemo(() => Object.keys(itemStyleFocusVisible || {}), [itemStyleFocusVisible]);
  const itemTransitionGlobal = useMemo(() => itemTransitionConfig?.global      || {},  [itemTransitionConfig]);

  const hasItemTransitionChanges = useMemo(() => {
    const overridesCount    = Object.keys(itemTransitionConfig?.overrides || {}).length;
    const hasStateOverrides = Object.values(itemTransitionConfig?.states  || {}).some(
      (s) => s && (s.linked === false || (s.unlinkedProperties || []).length > 0)
    );
    const hasGlobalOverrides = Object.entries(DEFAULT_TRANSITION_GLOBAL).some(
      ([key, def]) => itemTransitionGlobal[key] !== undefined && itemTransitionGlobal[key] !== def
    );
    return hasGlobalOverrides || overridesCount > 0 || hasStateOverrides;
  }, [itemTransitionConfig, itemTransitionGlobal]);

  const isItemBaseTabModified         = useMemo(() => hasModifiedStyleProps(itemStyle,             itemBaseKeys)  || hasItemTransitionChanges, [itemStyle,             itemBaseKeys,         hasItemTransitionChanges]);
  const isItemHoverTabModified        = useMemo(() => hasModifiedStyleProps(itemStyleHover,        itemHoverKeys),                              [itemStyleHover,        itemHoverKeys]);
  const isItemFocusVisibleTabModified = useMemo(() => hasModifiedStyleProps(itemStyleFocusVisible, itemFocusVisibleKeys),                       [itemStyleFocusVisible, itemFocusVisibleKeys]);

  const isItemResponsiveModified = useMemo(() =>
    Object.keys(itemResponsiveStyle || {}).some((key) =>
      Object.keys(itemResponsiveStyle[key]?.base         || {}).length > 0 ||
      Object.keys(itemResponsiveStyle[key]?.hover        || {}).length > 0 ||
      Object.keys(itemResponsiveStyle[key]?.focusVisible || {}).length > 0
    ), [itemResponsiveStyle]
  );
  const isContainerResponsiveModified = useMemo(() =>
    Object.keys(responsiveStyle || {}).some((key) =>
      Object.keys(responsiveStyle[key]?.base || {}).length > 0
    ), [responsiveStyle]
  );

  const isItemTabModified      = isItemBaseTabModified || isItemHoverTabModified || isItemFocusVisibleTabModified || isItemResponsiveModified;
  const isContainerTabModified = hasModifiedStyleProps(customStyle, Object.keys(customStyle || {})) || isContainerResponsiveModified;

  // -- Canvas styles ----------------------------------------------------------

  const uniqueClassName        = useCanvasStyles({ uniqueId, clientId, customStyle, itemStyle, itemStyleHover, itemStyleFocusVisible, responsiveStyle, itemResponsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedContainerClass = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();
  const containerInlineStyle   = useMemo(() => customStyleToInlineStyle(customStyle), [customStyle]);

  const blockProps   = useBlockProps({ className: combinedContainerClass || undefined, style: containerInlineStyle });
  const isSample     = previewValues.length === 0;
  const valuesToShow = isSample ? [SAMPLE_VALUES[itemType]] : previewValues.slice(0, previewLimit);

  // -- Render -----------------------------------------------------------------

  return (
    <>
      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          <TabPanel
            className="tmsblocks-dynamic-field-style-tabs tmsblocks-inspector-top-tabs"
            tabs={[
              { name: 'settings',  title: 'Settings' },
              { name: 'item',      title: <ControlLabel label="Item"      isSet={isItemTabModified}      /> },
              { name: 'container', title: <ControlLabel label="Container" isSet={isContainerTabModified} /> },
            ]}
          >
            {(tab) => {

              // -- Settings ---------------------------------------------------
              if (tab.name === 'settings') {
                return (
                  <div className="tmsblocks-inspector-controls" style={{ backgroundColor: 'var(--tms-cold-white)', padding: '16px' }}>
                    <FieldPresetSelector
                      taxonomyOptions={taxonomyOptions}
                      onApply={(patch) => setAttributes(patch)}
                    />
                    <DynamicFieldSettings
                      steps={steps} path={path} resolvedPath={resolvedPath}
                      separator={separator} emptyText={emptyText}
                      dateFormat={dateFormat} commentsNoText={commentsNoText}
                      commentsOneText={commentsOneText} commentsManyText={commentsManyText}
                      taxonomyOptions={taxonomyOptions} postMetaOptions={postMetaOptions}
                      termMetaOptionsByTax={termMetaOptionsByTax} userMetaOptions={userMetaOptions}
                      onPathChange={(newSteps, newPath) => setAttributes({ steps: newSteps, path: newPath })}
                      onSeparatorChange={(v) => setAttributes({ separator: v })}
                      onEmptyTextChange={(v) => setAttributes({ emptyText: v })}
                      onDateFormatChange={(v) => setAttributes({ dateFormat: v })}
                      onCommentsNoTextChange={(v) => setAttributes({ commentsNoText: v })}
                      onCommentsOneTextChange={(v) => setAttributes({ commentsOneText: v })}
                      onCommentsManyTextChange={(v) => setAttributes({ commentsManyText: v })}
                      showPostSourceControls postSource={postSource}
                      sourcePostId={sourcePostId} sourcePostType={sourcePostType} setAttributes={setAttributes}
                      showPreview={!!(resolvedPath || path)} previewLabel="Preview"
                      previewValue={resolvedPreviewValue}
                      previewHelp={previewError || 'Preview of first resolved value for current post context.'}
                    />
                    <RangeControl
                      label="Preview limit"
                      value={previewLimit}
                      onChange={(v) => setAttributes({ previewLimit: v })}
                      min={1} max={20}
                      help="Max items shown in the editor."
                      style={{ marginTop: '12px' }}
                    />

                    <div style={{ borderTop: '1px solid #eee', margin: '16px 0 12px' }} />

                    <SelectControl label="Item type" value={itemType} options={ITEM_TYPES} onChange={handleItemTypeChange} />
                    {itemType === 'image' && (
                      <Notice status="info" isDismissible={false}>
                        For single images with full controls, use the TMS Img block instead.
                        This mode outputs basic img tags from multi-value field paths.
                      </Notice>
                    )}
                    {itemType === 'text' && (
                      <TagControls
                        tagName={itemTagName}
                        setTagName={(v) => setAttributes({ itemTagName: v })}
                        tagNameOptions={[
                          { label: 'Span (inline)',  value: 'span' },
                          { label: 'Div (block)',    value: 'div'  },
                          { label: 'P (paragraph)', value: 'p'    },
                          { label: 'Li (list item)', value: 'li'  },
                          { label: 'H2',             value: 'h2'  },
                          { label: 'H3',             value: 'h3'  },
                          { label: 'H4',             value: 'h4'  },
                        ]}
                      />
                    )}
                    {itemType === 'url' && (
                      <UrlItemSettings
                        hrefSource={hrefSource} staticHref={staticHref}
                        hrefSteps={hrefSteps} hrefPath={hrefPath} resolvedHrefPath={resolvedHrefPath}
                        hrefPreviewValue={hrefPreviewValue} resolvedPreviewValue={resolvedPreviewValue}
                        linkLabelMode={linkLabelMode} linkText={linkText}
                        linkTextSteps={linkTextSteps} linkTextPath={linkTextPath} resolvedLinkTextPath={resolvedLinkTextPath}
                        linkTextValues={linkTextValues} linkTarget={linkTarget}
                        taxonomyOptions={taxonomyOptions} postMetaOptions={postMetaOptions}
                        termMetaOptionsByTax={termMetaOptionsByTax} userMetaOptions={userMetaOptions}
                        setAttributes={setAttributes}
                      />
                    )}
                    <ClassNameControl value={itemClassName} onChange={(v) => setAttributes({ itemClassName: v })} />

                    <PanelBody title="Container Wrapper" initialOpen={false} style={{ margin: 0, padding: 0 }}>
                      <div style={{ margin: '-16px', marginTop: '4px' }}>
                        <IdentityControls attributes={attributes} setAttributes={setAttributes} />
                        <TagControls tagName={tagName} setTagName={(v) => setAttributes({ tagName: v })} />
                        <AriaControls attributes={attributes} setAttributes={setAttributes} />
                        <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} />
                      </div>
                    </PanelBody>
                  </div>
                );
              }

              // -- Item -------------------------------------------------------
              if (tab.name === 'item') {
                const isDesktop = activeBreakpoint === 'desktop';

                const getActiveItemStyle = (stateKey) =>
                  isDesktop
                    ? { base: itemStyle, hover: itemStyleHover, focusVisible: itemStyleFocusVisible }[stateKey]
                    : getItemStyle(activeBreakpoint, stateKey);

                const getActiveItemUpdater = (stateKey) =>
                  isDesktop
                    ? { base: updateItemStyle, hover: updateItemStyleHover, focusVisible: updateItemStyleFocusVisible }[stateKey]
                    : getItemUpdater(activeBreakpoint, stateKey);

                const isStateModified = (stateKey) => {
                  if (isDesktop) return { base: isItemBaseTabModified, hover: isItemHoverTabModified, focusVisible: isItemFocusVisibleTabModified }[stateKey];
                  const s = getItemStyle(activeBreakpoint, stateKey);
                  return hasModifiedStyleProps(s, Object.keys(s || {}));
                };

                return (
                  <>
                    <BreakpointSelector
                      allBreakpoints={allBreakpoints}
                      activeBreakpoint={activeBreakpoint}
                      setBreakpoint={setActiveBreakpoint}
                      isDesktopModified={isItemBaseTabModified || isItemHoverTabModified || isItemFocusVisibleTabModified}
                      getBreakpointIsSet={(key) =>
                        Object.keys(responsiveStyle?.[key]?.base || {}).length > 0 ||
                        Object.keys(itemResponsiveStyle?.[key]?.base || {}).length > 0 ||
                        Object.keys(itemResponsiveStyle?.[key]?.hover || {}).length > 0 ||
                        Object.keys(itemResponsiveStyle?.[key]?.focusVisible || {}).length > 0
                      }
                      breakpointOverrides={breakpointOverrides}
                      setAttributes={setAttributes}
                    />

                    <TabPanel
                      className="tmsblocks-item-style-state-tabs"
                      tabs={[
                        { name: 'base',          title: <ControlLabel label="Base"          isSet={isStateModified('base')}         /> },
                        { name: 'hover',         title: <ControlLabel label="Hover"         isSet={isStateModified('hover')}        /> },
                        { name: 'focus-visible', title: <ControlLabel label="Focus-Visible" isSet={isStateModified('focusVisible')} /> },
                      ]}
                    >
                      {(itemTab) => {
                        const stateKey      = itemTab.name === 'focus-visible' ? 'focusVisible' : itemTab.name;
                        const activeStyle   = getActiveItemStyle(stateKey);
                        const activeUpdater = getActiveItemUpdater(stateKey);

                        if (itemTab.name === 'hover' || itemTab.name === 'focus-visible') {
                          return (
                            <>
                              {isDesktop && (
                                <TransitionControls
                                  customStyle={itemStyle}
                                  updateCustomStyle={updateItemStyle}
                                  stateStyles={{ hover: itemStyleHover, focusVisible: itemStyleFocusVisible }}
                                  transitionConfig={itemTransitionConfig}
                                  setTransitionConfig={setItemTransitionConfig}
                                />
                              )}
                              <StyleControls
                                updateCustomStyle={activeUpdater}
                                attributes={{ ...attributes, customStyle: activeStyle }}
                                setAttributes={(patch) => {
                                  if (patch.customStyle !== undefined) activeUpdater(patch.customStyle);
                                  else setAttributes(patch);
                                }}
                                clientId={clientId}
                                include={ITEM_STYLE_INCLUDE[itemType] || ITEM_STYLE_INCLUDE.text}
                                exclude={['Transition']}
                                controlProps={{ Display: { useUtilityClasses: false } }}
                              />
                            </>
                          );
                        }

                        // Base
                        return (
                          <>
                            <StyleControls
                              updateCustomStyle={activeUpdater}
                              attributes={{ ...attributes, customStyle: activeStyle }}
                              setAttributes={(patch) => {
                                if (patch.customStyle !== undefined) activeUpdater(patch.customStyle);
                                else setAttributes(patch);
                              }}
                              clientId={clientId}
                              include={ITEM_STYLE_INCLUDE[itemType] || ITEM_STYLE_INCLUDE.text}
                              controlProps={isDesktop ? {
                                Display: { showCursor: true },
                                Transition: {
                                  stateStyles: { hover: itemStyleHover, focusVisible: itemStyleFocusVisible },
                                  transitionConfig: itemTransitionConfig,
                                  setTransitionConfig: setItemTransitionConfig,
                                },
                              } : {}}
                            />
                          </>
                        );
                      }}
                    </TabPanel>
                  </>
                );
              }

              // -- Container --------------------------------------------------
              const isDesktop = activeBreakpoint === 'desktop';

              return (
                <>
                  <BreakpointSelector
                    allBreakpoints={allBreakpoints}
                    activeBreakpoint={activeBreakpoint}
                    setBreakpoint={setActiveBreakpoint}
                    isDesktopModified={hasModifiedStyleProps(customStyle, Object.keys(customStyle || {}))}
                    getBreakpointIsSet={(key) =>
                      Object.keys(responsiveStyle?.[key]?.base || {}).length > 0 ||
                      Object.keys(itemResponsiveStyle?.[key]?.base || {}).length > 0 ||
                      Object.keys(itemResponsiveStyle?.[key]?.hover || {}).length > 0 ||
                      Object.keys(itemResponsiveStyle?.[key]?.focusVisible || {}).length > 0
                    }
                    breakpointOverrides={breakpointOverrides}
                    setAttributes={setAttributes}
                  />

                  {isDesktop ? (
                    <>
                      <StyleControls
                        updateCustomStyle={updateCustomStyle}
                        attributes={attributes}
                        setAttributes={setAttributes}
                        clientId={clientId}
                        controlProps={{ Display: { showCursor: true } }}
                      />
                    </>
                  ) : (
                    <StyleControls
                      updateCustomStyle={getContainerUpdater(activeBreakpoint, 'base')}
                      attributes={{ ...attributes, customStyle: getContainerStyle(activeBreakpoint, 'base') }}
                      setAttributes={(patch) => {
                        if (patch.customStyle !== undefined) getContainerUpdater(activeBreakpoint, 'base')(patch.customStyle);
                        else setAttributes(patch);
                      }}
                      clientId={clientId}
                    />
                  )}
                </>
              );
            }}
          </TabPanel>
        </div>
      </InspectorControls>

      <div {...blockProps}>
        {!renderBlock && <span style={{ color: '#666', fontSize: '11px' }}>Render Block is disabled. This block will not render on the frontend.</span>}
        {renderBlock && previewError && <span style={{ color: '#c0392b', fontSize: '11px' }}>{previewError}</span>}
        {renderBlock && (
          <CanvasItems
            valuesToShow={valuesToShow} isSample={isSample}
            itemType={itemType} itemTagName={itemTagName} itemClassName={itemClassName} itemStyle={itemStyle}
            hrefSource={hrefSource} staticHref={staticHref} hrefValues={hrefPreviewValues}
            linkLabelMode={linkLabelMode} linkText={linkText} linkTextValues={linkTextValues}
            linkTarget={linkTarget} separator={separator}
          />
        )}
        <br />
      </div>
    </>
  );
}

// -- Entry point --------------------------------------------------------------

export default function Edit(props) {
  const { clientId, attributes, setAttributes } = props;
  const { uniqueId } = attributes;

  useUniqueId({ uniqueId, clientId, setAttributes });

  const isSelected = useSelect(
    (select) => select(blockEditorStore).getSelectedBlockClientId() === clientId,
    [clientId]
  );
  if (isSelected) return <EditSelected {...props} />;
  return <EditCanvas {...props} />;
}
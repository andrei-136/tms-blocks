import React, { useMemo, useState } from 'react';
import {
  AlignmentToolbar,
  BlockControls,
  InspectorControls,
  RichText,
  useBlockProps,
  useStyleOverride,
  store as blockEditorStore,
} from '@wordpress/block-editor';
import {
  Notice,
  Modal,
  Button,
  SelectControl,
  TabPanel,
  TextareaControl,
  ToggleControl,
  ToolbarButton,
  ToolbarDropdownMenu,
  ToolbarGroup,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { customStyleToCSSString, getModificationLevel, hasModifiedStyleProps, computeNextStyle, getCustomSelectorsLevel } from '../../../shared/src/style-utils';
import { useCustomStyle, useUniqueId, useDynamicField, useBreakpointStyles, useCustomSelectorsStyle } from '../../../shared/src/hooks';
import {
  StyleControls, IdentityControls,
  AriaControls, BreakpointSelector, CustomAttributesControls, ControlLabel, CustomSelectorsControls, TransitionControls, ContentControls,
} from '../../../shared/src/controls';
import PanelTitle from '../../../shared/src/controls/PanelTitle';
import DynamicFieldSettings from '../../../shared/src/controls/DynamicFieldSettings';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

// -- Constants ----------------------------------------------------------------

const PHRASING_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn',
  'em', 'i', 'kbd', 'mark', 'q', 'ruby', 'rp', 'rt', 'rtc', 's',
  'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',
]);

const HEADING_OPTIONS = [
  { label: 'H1', level: 1 }, { label: 'H2', level: 2 }, { label: 'H3', level: 3 },
  { label: 'H4', level: 4 }, { label: 'H5', level: 5 }, { label: 'H6', level: 6 },
];

const HEADING_STYLE_EXCLUDE = ['Transition'];

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

// -- Shared style hook --------------------------------------------------------

function useHeadingStyle({ uniqueId, clientId, customStyle, responsiveStyle, breakpointOverrides, customBreakpoints }) {
  const uniqueClassName = uniqueId ? `tmsblocks-heading-${uniqueId}` : '';

  const cssString = useMemo(() =>
    customStyleToCSSString(customStyle)
      .split('; ')
      .filter(Boolean)
      .map((rule) => `${rule} !important`)
      .join('; '),
    [customStyle]
  );

  const cssStringResponsive = useMemo(() => {
    if (!uniqueClassName) return '';
    const resolved = resolveBreakpoints(
      breakpointOverrides,
      Object.keys(responsiveStyle || {}),
      customBreakpoints
    );
    return resolved.map(({ key, maxWidth }) => {
      const base  = customStyleToCSSString(responsiveStyle?.[key]?.base         || {});
      const hover = customStyleToCSSString(responsiveStyle?.[key]?.hover        || {});
      const focus = customStyleToCSSString(responsiveStyle?.[key]?.focusVisible || {});
      const lines = [];
      if (base)  lines.push(`@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClassName} { ${base} } }`);
      if (hover) lines.push(`@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClassName}:hover { ${hover} } }`);
      if (focus) lines.push(`@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClassName}:focus-visible { ${focus} } }`);
      return lines.join('\n');
    }).join('\n');
  }, [uniqueClassName, responsiveStyle, breakpointOverrides, customBreakpoints]);

  useStyleOverride({
    id: `tmsblocks-heading-${clientId}`,
    css: uniqueClassName
      ? [
          cssString ? `.editor-styles-wrapper .${uniqueClassName} { ${cssString} }` : '',
          cssStringResponsive,
        ].filter(Boolean).join('\n')
      : '',
  });

  return uniqueClassName;
}

// -- Phrasing tag validator ----------------------------------------------------

function useInvalidTags(content, skip = false) {
  return useMemo(() => {
    if (skip || !content || typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return [];
    const doc  = new window.DOMParser().parseFromString(`<div>${content}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return [];
    const invalid = new Set();
    const walker  = doc.createTreeWalker(root, window.NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const t = node.tagName.toLowerCase();
      if (!PHRASING_TAGS.has(t)) invalid.add(t);
      node = walker.nextNode();
    }
    return Array.from(invalid);
  }, [content, skip]);
}

// -- Breakpoint state tabs ----------------------------------------------------

function BreakpointStateTabs({
  customStyle,
  customStyleHover,
  customStyleFocusVisible,
  updateCustomStyle,
  updateCustomStyleHover,
  updateCustomStyleFocusVisible,
  getUpdater,
  getStyle,
  activeBreakpoint,
  attributes,
  setAttributes,
  clientId,
  masterAttributes,
}) {
  const isDesktop = activeBreakpoint === 'desktop';

  const base = {
    style:   isDesktop ? customStyle             : getStyle(activeBreakpoint, 'base'),
    updater: isDesktop ? updateCustomStyle       : getUpdater(activeBreakpoint, 'base'),
  };
  const hover = {
    style:   isDesktop ? customStyleHover        : getStyle(activeBreakpoint, 'hover'),
    updater: isDesktop ? updateCustomStyleHover  : getUpdater(activeBreakpoint, 'hover'),
  };
  const focus = {
    style:   isDesktop ? customStyleFocusVisible       : getStyle(activeBreakpoint, 'focusVisible'),
    updater: isDesktop ? updateCustomStyleFocusVisible : getUpdater(activeBreakpoint, 'focusVisible'),
  };

  // Compute master styles for comparison (same breakpoint / state as the instance).
  // When masterAttributes is present but lacks a specific style key, default to
  // {} so that any instance-only values are treated as overrides (orange), not
  // standalone (blue).
  const masterBaseStyle  = masterAttributes
    ? (isDesktop ? (masterAttributes.customStyle             ?? {}) : (masterAttributes.responsiveStyle?.[activeBreakpoint]?.base         ?? {}))
    : null;
  const masterHoverStyle = masterAttributes
    ? (isDesktop ? (masterAttributes.customStyleHover        ?? {}) : (masterAttributes.responsiveStyle?.[activeBreakpoint]?.hover        ?? {}))
    : null;
  const masterFocusStyle = masterAttributes
    ? (isDesktop ? (masterAttributes.customStyleFocusVisible ?? {}) : (masterAttributes.responsiveStyle?.[activeBreakpoint]?.focusVisible ?? {}))
    : null;

  const baseLevel  = getModificationLevel(base.style,  Object.keys(base.style  || {}), masterBaseStyle);
  const hoverLevel = getModificationLevel(hover.style, Object.keys(hover.style || {}), masterHoverStyle);
  const focusLevel = getModificationLevel(focus.style, Object.keys(focus.style || {}), masterFocusStyle);

  const tabs = [
    { name: 'base',          title: <ControlLabel label="Base"          level={baseLevel}  /> },
    { name: 'hover',         title: <ControlLabel label="Hover"         level={hoverLevel} /> },
    { name: 'focus-visible', title: <ControlLabel label="Focus-Visible" level={focusLevel} /> },
    { name: 'custom-css',    title: <ControlLabel label="CSS+" level={getCustomSelectorsLevel(attributes.customSelectors, masterAttributes, activeBreakpoint)} /> },
  ];

  return (
    <TabPanel className="tmsblocks-state-tabs" tabs={tabs}>
      {(tab) => {
        if (tab.name === 'hover') {
          return (
            <StyleControls
              updateCustomStyle={hover.updater}
              attributes={{ ...attributes, customStyle: hover.style }}
              setAttributes={(patch) => {
                if (patch.customStyle !== undefined) hover.updater(patch.customStyle);
                else setAttributes(patch);
              }}
              clientId={clientId}
              exclude={HEADING_STYLE_EXCLUDE}
              controlProps={{ Display: { useUtilityClasses: false } }}
              masterStyle={masterHoverStyle}
              masterAttributes={masterAttributes}
            />
          );
        }

        if (tab.name === 'focus-visible') {
          return (
            <StyleControls
              updateCustomStyle={focus.updater}
              attributes={{ ...attributes, customStyle: focus.style }}
              setAttributes={(patch) => {
                if (patch.customStyle !== undefined) focus.updater(patch.customStyle);
                else setAttributes(patch);
              }}
              clientId={clientId}
              exclude={HEADING_STYLE_EXCLUDE}
              controlProps={{ Display: { useUtilityClasses: false } }}
              masterStyle={masterFocusStyle}
              masterAttributes={masterAttributes}
            />
          );
        }

        if (tab.name === 'custom-css') {
          return (
            <CustomSelectorsControls
              customSelectors={attributes.customSelectors || {}}
              onChange={(next) => setAttributes({ customSelectors: next })}
              blockClassName={attributes.uniqueId ? `.tmsblocks-heading-${attributes.uniqueId}` : ''}
              activeBreakpoint={activeBreakpoint}
              masterAttributes={masterAttributes}
              renderStyleControls={(entry, onUpdateEntry, _onRemove, activeIndex, masterEntry) => {
                const isPseudo = /^&:{1,2}(before|after)$/.test(entry.selector?.trim());
                return (
                <React.Fragment key={activeIndex}>
                {isPseudo && (
                <ContentControls
                  customStyle={entry.customStyle || {}}
                  updateCustomStyle={(prop, value) => onUpdateEntry({ customStyle: computeNextStyle(entry.customStyle || {}, prop, value) })}
                />
                )}
                <TransitionControls
                  target="selector"
                  customStyle={entry.customStyle || {}}
                  updateCustomStyle={(prop, value) => onUpdateEntry({ customStyle: computeNextStyle(entry.customStyle || {}, prop, value) })}
                />
                <StyleControls
                  updateCustomStyle={(prop, value, unit) => onUpdateEntry({ customStyle: computeNextStyle(entry.customStyle || {}, prop, value, unit) })}
                  attributes={{ ...attributes, customStyle: entry.customStyle || {} }}
                  setAttributes={(patch) => {
                    if (patch.customStyle !== undefined) onUpdateEntry({ customStyle: patch.customStyle });
                    else setAttributes(patch);
                  }}
                  clientId={clientId}
                  include={['List']}
                  exclude={HEADING_STYLE_EXCLUDE}
                  masterStyle={masterAttributes ? (masterEntry?.customStyle || {}) : null}
                  masterAttributes={masterAttributes}
                />
                </React.Fragment>
              );}}
            />
          );
        }

        // Base tab
        return (
          <StyleControls
            updateCustomStyle={base.updater}
            attributes={{ ...attributes, customStyle: base.style }}
            setAttributes={(patch) => {
              if (patch.customStyle !== undefined) base.updater(patch.customStyle);
              else setAttributes(patch);
            }}
            clientId={clientId}
            exclude={HEADING_STYLE_EXCLUDE}
            masterStyle={masterBaseStyle}
            masterAttributes={masterAttributes}
          />
        );
      }}
    </TabPanel>
  );
}

// -- EditCanvas ---------------------------------------------------------------

function EditCanvas({ attributes, setAttributes, clientId, previewValues }) {
  const {
    uniqueId,
    content          = '',
    level            = 2,
    anchorId,
    tmsClassName     = '',
    ariaLabel,
    ariaRole,
    role,
    customStyle      = {},
    responsiveStyle  = {},
    breakpointOverrides = {},
    customBreakpoints   = [],
    isDynamic        = false,
    dynamicPath      = '',
    separator        = '',
  } = attributes;

  const safeLevel         = Math.min(6, Math.max(1, level));
  const tagName           = `h${safeLevel}`;
  const uniqueClassName   = useHeadingStyle({ uniqueId, clientId, customStyle, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();
  const invalidTags       = useInvalidTags(content, isDynamic);

  useCustomSelectorsStyle({ uniqueId, clientId, classPrefix: 'tmsblocks-heading', customSelectors: attributes.customSelectors || {}, breakpointOverrides: attributes.breakpointOverrides || {}, customBreakpoints: attributes.customBreakpoints || [] });

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole || role || undefined,
  });

  if (isDynamic) {
    const previewHtml = previewValues.length ? previewValues.join(separator || ', ') : null;
    const Tag = tagName;
    return (
      <Tag {...blockProps}>
        {previewHtml
          ? <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
          : <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
              {dynamicPath || 'Dynamic heading - path not set'}
            </span>
        }
      </Tag>
    );
  }

  return (
    <>
      {invalidTags.length > 0 && (
        <Notice status="warning" isDismissible={false}>
          Heading content should only include phrasing tags. Invalid tags detected: {invalidTags.join(', ')}.
        </Notice>
      )}
      <RichText
        allowedFormats={['core/bold', 'core/italic', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
        {...blockProps}
        identifier="content"
        tagName={tagName}
        value={content}
        onChange={(newContent) => setAttributes({ content: newContent })}
        placeholder="Write heading"
        keepPlaceholderOnFocus
      />
    </>
  );
}

// -- EditSelected -------------------------------------------------------------

function EditSelected({
  attributes,
  setAttributes,
  clientId,
  context,
  previewValues,
  previewError,
  postMetaOptions,
  termMetaOptionsByTax,
  userMetaOptions,
  masterAttributes,
}) {
  const {
    uniqueId,
    content              = '',
    level                = 2,
    anchorId,
    tmsClassName         = '',
    ariaLabel,
    ariaRole,
    role,
    customStyle          = {},
    customStyleHover     = {},
    customStyleFocusVisible = {},
    responsiveStyle      = {},
    breakpointOverrides  = {},
    customBreakpoints    = [],
    renderBlock          = true,
    isDynamic            = false,
    dynamicSteps         = [],
    dynamicPath          = '',
    dynamicDateFormat        = '',
    dynamicCommentsNoText    = '',
    dynamicCommentsOneText   = '',
    dynamicCommentsManyText  = '',
    separator            = '',
    emptyText            = '',
    sourcePostType       = '',
    sourcePostId         = 0,
    postSource           = 'current',
  } = attributes;

  const safeLevel  = Math.min(6, Math.max(1, level));
  const tagName    = `h${safeLevel}`;
  const currentLabel = HEADING_OPTIONS.find((o) => o.level === safeLevel)?.label || 'H2';

  const customStyleTextAlign = typeof customStyle.textAlign === 'object' && customStyle.textAlign !== null
    ? customStyle.textAlign.value : customStyle.textAlign;

  // -- Taxonomies -------------------------------------------------------------

  const taxonomies = useSelect((select) => select('core').getTaxonomies({ per_page: -1 }) || [], []);
  const taxonomyOptions = useMemo(() =>
    [{ label: 'Select taxonomy', value: '' }].concat(
      taxonomies.map((t) => ({ label: t?.name || t?.slug, value: t?.slug }))
    ),
    [taxonomies]
  );

  const resolvedPath = useMemo(() => stepsToPath(dynamicSteps), [dynamicSteps]);

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle             = useCustomStyle(customStyle,             setAttributes, 'customStyle');
  const updateCustomStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateCustomStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const { getUpdater, getStyle }      = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Breakpoint tabs --------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');
  const [isHtmlModalOpen, setIsHtmlModalOpen]   = useState(false);
  const [draftHtml, setDraftHtml]               = useState(content || '');

  const allBreakpoints = useMemo(() =>
    resolveBreakpoints(breakpointOverrides, Object.keys(responsiveStyle || {}), customBreakpoints),
    [breakpointOverrides, responsiveStyle, customBreakpoints]
  );

  // -- Dot system: level-based comparison against master ---------------------

  const baseKeys           = useMemo(() => Object.keys(customStyle || {}), [customStyle]);
  const hoverKeys          = useMemo(() => Object.keys(customStyleHover || {}), [customStyleHover]);
  const focusKeys          = useMemo(() => Object.keys(customStyleFocusVisible || {}), [customStyleFocusVisible]);
  const isBaseModified     = hasModifiedStyleProps(customStyle, baseKeys);
  const isResponsiveModified = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );

  const desktopLevel      = getModificationLevel(customStyle,             baseKeys,  masterAttributes ? (masterAttributes.customStyle             ?? {}) : null);
  const hoverDesktopLevel  = getModificationLevel(customStyleHover,        hoverKeys, masterAttributes ? (masterAttributes.customStyleHover        ?? {}) : null);
  const focusDesktopLevel  = getModificationLevel(customStyleFocusVisible, focusKeys, masterAttributes ? (masterAttributes.customStyleFocusVisible ?? {}) : null);

  // Dot for heading level — same wrapper-property convention as the other
  // controls: NO dot on standalone; on an instance, no dot when both are at
  // the default (2), purple when the instance matches the master, orange
  // when overridden. masterAttributes.level may be absent if the master
  // snapshot is stale — fall back to the block default (2).
  const headingLevelDot = useMemo(() => {
    if (!masterAttributes) return 0;
    const masterLevel = masterAttributes.level ?? 2;
    if (safeLevel === 2 && masterLevel === 2) return 0;
    return safeLevel === masterLevel ? 2 : 3;
  }, [masterAttributes, safeLevel]);

  // Dynamic-content toggle dot. Mirrors the wrapper-property convention
  // (see WrapperControls / IdentityControls): NO dot on standalone blocks —
  // wrapper properties have no standalone default indicator, unlike CSS
  // properties. On an instance: purple when set + matches master, orange
  // when overridden; both at the default (off) shows no dot.
  const dynamicLevel = masterAttributes
    ? (isDynamic === false && !(masterAttributes.isDynamic || false)
        ? 0
        : (isDynamic === (masterAttributes.isDynamic || false) ? 2 : 3))
    : 0;

  // Breakpoint-level dots: compare responsive styles against master's responsive styles.
  // When masterAttributes exists, an absent responsive-style entry is treated as
  // an empty baseline {} so that any instance-only values show as overrides (orange).
  const getBreakpointLevel = useMemo(() => (key) => {
    const masterResp = masterAttributes?.responsiveStyle?.[key];
    const instResp   = responsiveStyle?.[key];
    let maxLevel = 0;
    for (const state of ['base', 'hover', 'focusVisible']) {
      const instStyle   = instResp?.[state] || {};
      const masterStyle = masterAttributes
        ? (masterResp?.[state] ?? {})
        : null;
      const level = getModificationLevel(instStyle, Object.keys(instStyle), masterStyle);
      if (level > maxLevel) maxLevel = level;
    }
    return maxLevel;
  }, [masterAttributes, responsiveStyle]);

  // Aggregate highest level across all desktop states + all responsive breakpoints
  const responsiveMaxLevel = useMemo(() => {
    let max = 0;
    for (const key of Object.keys(responsiveStyle || {})) {
      max = Math.max(max, getBreakpointLevel(key));
    }
    return max;
  }, [getBreakpointLevel, responsiveStyle]);

  const stylesTabLevel = Math.max(desktopLevel, hoverDesktopLevel, focusDesktopLevel, responsiveMaxLevel);

  // Wrapper tab dot: aggregate override level across all wrapper attributes
  const wrapperTabLevel = useMemo(() => {
    if (!masterAttributes) return 0;
    const attrNames = ['tagName', 'anchorId', 'tmsClassName', 'ariaLabel', 'ariaRole'];
    let maxLevel = 0;
    for (const key of attrNames) {
      const def = key === 'tagName' ? 'div' : '';
      const inst = attributes[key] || def;
      const master = masterAttributes[key] || def;
      if (inst === def && master === def) continue;
      maxLevel = Math.max(maxLevel, inst === master ? 2 : 3);
    }
    for (const key of ['customAttributes', 'extraAriaAttributes']) {
      const inst = JSON.stringify(attributes[key] || []);
      const master = JSON.stringify(masterAttributes[key] || []);
      if (inst === '[]' && master === '[]') continue;
      maxLevel = Math.max(maxLevel, inst === master ? 2 : 3);
    }
    return maxLevel;
  }, [masterAttributes, attributes]);


  // -- Canvas styles ----------------------------------------------------------

  const uniqueClassName   = useHeadingStyle({ uniqueId, clientId, customStyle, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();

  useCustomSelectorsStyle({ uniqueId, clientId, classPrefix: 'tmsblocks-heading', customSelectors: attributes.customSelectors || {}, breakpointOverrides: attributes.breakpointOverrides || {}, customBreakpoints: attributes.customBreakpoints || [] });

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole || role || undefined,
  });

  const invalidTags  = useInvalidTags(content, isDynamic);
  const previewHtml  = previewValues.length ? previewValues.join(separator || ', ') : '';
  const Tag          = tagName;

  return (
    <>
      <BlockControls>
        <ToolbarGroup>
          <ToolbarDropdownMenu
            icon={null}
            text={currentLabel}
            label="Change heading level"
            controls={HEADING_OPTIONS.map(({ label, level: optionLevel }) => ({
              title:    label,
              onClick:  () => setAttributes({ level: optionLevel }),
              isActive: optionLevel === safeLevel,
            }))}
          />
        </ToolbarGroup>
        {!isDynamic && (
          <AlignmentToolbar
            value={customStyleTextAlign || ''}
            onChange={(newAlign) => updateCustomStyle('textAlign', newAlign || null)}
          />
        )}
        {!isDynamic && (
          <ToolbarGroup>
            <ToolbarButton
              isPressed={isHtmlModalOpen}
              onClick={() => {
                setDraftHtml(content || '');
                setIsHtmlModalOpen(true);
              }}
            >
              Edit HTML
            </ToolbarButton>
          </ToolbarGroup>
        )}
      </BlockControls>

      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-heading-top-tabs tmsblocks-inspector-top-tabs"
            tabs={[
              { name: 'wrapper', title: <ControlLabel label="Wrapper" level={wrapperTabLevel} /> },
              { name: 'styles',  title: <ControlLabel label="Styles"  level={stylesTabLevel} /> },
            ]}
          >
            {(tab) => {

              // -- Wrapper tab ------------------------------------------------
              if (tab.name === 'wrapper') {
                return (
                  <div style={{ backgroundColor: 'var(--tms-cold-white)', padding: '16px' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' }}>
                      <SelectControl
                        label={<ControlLabel label="Heading Level" level={headingLevelDot} />}
                        value={String(safeLevel)}
                        options={HEADING_OPTIONS.map(({ label, level: optionLevel }) => ({ label, value: String(optionLevel) }))}
                        onChange={(newLevel) => setAttributes({ level: Number(newLevel) })}
                      />
                      <div style={{ borderTop: '1px solid #eee', marginTop: '16px', paddingTop: '16px' }}>
                        <ToggleControl
                          label={<ControlLabel label="Use dynamic content" level={dynamicLevel} />}
                          checked={isDynamic}
                          onChange={(next) => {
                            if (next) {
                              setAttributes({ isDynamic: true });
                            } else {
                              setAttributes({
                                isDynamic:              false,
                                dynamicSteps:           [],
                                dynamicPath:            '',
                                dynamicDateFormat:      '',
                                dynamicCommentsNoText:  '',
                                dynamicCommentsOneText: '',
                                dynamicCommentsManyText: '',
                              });
                            }
                          }}
                        />
                        {isDynamic && (
                          <DynamicFieldSettings
                            steps={dynamicSteps}
                            path={dynamicPath}
                            resolvedPath={resolvedPath}
                            separator={separator}
                            emptyText={emptyText}
                            dateFormat={dynamicDateFormat}
                            commentsNoText={dynamicCommentsNoText}
                            commentsOneText={dynamicCommentsOneText}
                            commentsManyText={dynamicCommentsManyText}
                            taxonomyOptions={taxonomyOptions}
                            postMetaOptions={postMetaOptions}
                            termMetaOptionsByTax={termMetaOptionsByTax}
                            userMetaOptions={userMetaOptions}
                            onPathChange={(newSteps, newPath) => setAttributes({ dynamicSteps: newSteps, dynamicPath: newPath })}
                            onSeparatorChange={(v) => setAttributes({ separator: v })}
                            onEmptyTextChange={(v) => setAttributes({ emptyText: v })}
                            onDateFormatChange={(v) => setAttributes({ dynamicDateFormat: v })}
                            onCommentsNoTextChange={(v) => setAttributes({ dynamicCommentsNoText: v })}
                            onCommentsOneTextChange={(v) => setAttributes({ dynamicCommentsOneText: v })}
                            onCommentsManyTextChange={(v) => setAttributes({ dynamicCommentsManyText: v })}
                            showPostSourceControls
                            postSource={postSource}
                            sourcePostId={sourcePostId}
                            sourcePostType={sourcePostType}
                            setAttributes={setAttributes}
                            showPreview={!!(resolvedPath || dynamicPath)}
                            previewLabel="Preview"
                            previewValue={previewHtml || previewError || ''}
                            masterAttributes={masterAttributes}
                          />
                        )}
                      </div>
                    </div>
                    <AriaControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                    <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                    <IdentityControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                  </div>
                );
              }

              // -- Styles tab -------------------------------------------------
              return (
                <>
                  <BreakpointSelector
                    allBreakpoints={allBreakpoints}
                    activeBreakpoint={activeBreakpoint}
                    setBreakpoint={setActiveBreakpoint}
                    isDesktopModified={isBaseModified || getCustomSelectorsLevel(attributes.customSelectors, masterAttributes, 'desktop') > 0}
                    desktopLevel={Math.max(desktopLevel, getCustomSelectorsLevel(attributes.customSelectors, masterAttributes, 'desktop'))}
                    getBreakpointIsSet={(key) =>
                      Object.keys(responsiveStyle?.[key]?.base || {}).length > 0 ||
                      Object.keys(responsiveStyle?.[key]?.hover || {}).length > 0 ||
                      Object.keys(responsiveStyle?.[key]?.focusVisible || {}).length > 0 ||
                      getCustomSelectorsLevel(attributes.customSelectors, masterAttributes, key) > 0
                    }
                    getBreakpointLevel={(key) => Math.max(getBreakpointLevel(key), getCustomSelectorsLevel(attributes.customSelectors, masterAttributes, key))}
                    breakpointOverrides={breakpointOverrides}
                    setAttributes={setAttributes}
                  />

                  {/* State tabs for active breakpoint */}
                  <BreakpointStateTabs
                    customStyle={customStyle}
                    customStyleHover={customStyleHover}
                    customStyleFocusVisible={customStyleFocusVisible}
                    updateCustomStyle={updateCustomStyle}
                    updateCustomStyleHover={updateCustomStyleHover}
                    updateCustomStyleFocusVisible={updateCustomStyleFocusVisible}
                    getUpdater={getUpdater}
                    getStyle={getStyle}
                    activeBreakpoint={activeBreakpoint}
                    attributes={attributes}
                    setAttributes={setAttributes}
                    clientId={clientId}
                    masterAttributes={masterAttributes}
                  />
                </>
              );
            }}
          </TabPanel>
        </div>
      </InspectorControls>

      {/* Canvas output */}
      {isDynamic ? (
        <Tag {...blockProps}>
          {previewHtml
            ? <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
            : <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
                {dynamicPath || resolvedPath ? '...' : 'Dynamic heading - path not set'}
              </span>
          }
        </Tag>
      ) : (
        <>
          {invalidTags.length > 0 && (
            <Notice status="warning" isDismissible={false}>
              Heading content should only include phrasing tags. Invalid tags: {invalidTags.join(', ')}.
            </Notice>
          )}
          <RichText
            allowedFormats={['core/bold', 'core/italic', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
            {...blockProps}
            identifier="content"
            tagName={tagName}
            value={content}
            onChange={(newContent) => setAttributes({ content: newContent })}
            placeholder="Write heading..."
            keepPlaceholderOnFocus
          />
        </>
      )}

      {isHtmlModalOpen && (
        <Modal
          title="Edit heading HTML"
          onRequestClose={() => setIsHtmlModalOpen(false)}
          shouldCloseOnClickOutside={false}
        >
          <div style={{ width: 'min(960px, 90vw)', maxWidth: '960px' }}>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              Edit the raw heading HTML in a larger writing area. The canvas will keep showing the rendered block.
            </p>
            {invalidTags.length > 0 && (
              <Notice status="warning" isDismissible={false}>
                Heading content should only include phrasing tags. Invalid tags: {invalidTags.join(', ')}.
              </Notice>
            )}
            <TextareaControl
              label="Heading HTML"
              value={draftHtml}
              onChange={(newContent) => setDraftHtml(newContent)}
              rows={20}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setIsHtmlModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setAttributes({ content: draftHtml });
                  setIsHtmlModalOpen(false);
                }}
              >
                Apply HTML
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// -- Entry point --------------------------------------------------------------

export default function Edit(props) {
  const { clientId, attributes, context, setAttributes, masterAttributes } = props;
  const {
    uniqueId,
    isDynamic               = false,
    dynamicSteps            = [],
    dynamicPath             = '',
    dynamicDateFormat       = '',
    dynamicCommentsNoText   = '',
    dynamicCommentsOneText  = '',
    dynamicCommentsManyText = '',
    sourcePostId            = 0,
    sourcePostType          = '',
    postSource              = 'current',
  } = attributes;

  useUniqueId({ uniqueId, clientId, setAttributes });

  const editorPostId   = useSelect((select) => select('core/editor')?.getCurrentPostId?.()   || 0,      []);
  const editorPostType = useSelect((select) => select('core/editor')?.getCurrentPostType?.() || 'post', []);

  const currentPostType = postSource === 'specific'
    ? (sourcePostType || 'post')
    : (context?.['tmsblocks/contextPostType'] || context?.['tms/contextPostType'] || context?.postType || editorPostType);
  const currentPostId = postSource === 'specific'
    ? sourcePostId
    : (context?.['tmsblocks/contextPostId'] || context?.['tms/contextPostId'] || context?.postId || editorPostId);

  const resolvedPath = useMemo(() => stepsToPath(dynamicSteps), [dynamicSteps]);
  const previewPath  = resolvedPath || dynamicPath;

  const {
    previewValues,
    previewError,
    postMetaOptions,
    termMetaOptionsByTax,
    userMetaOptions,
  } = useDynamicField({
    path:              isDynamic ? previewPath : '',
    postId:            isDynamic ? currentPostId : 0,
    postType:          currentPostType,
    dateFormat:        dynamicDateFormat,
    commentsNoText:    dynamicCommentsNoText,
    commentsOneText:   dynamicCommentsOneText,
    commentsManyText:  dynamicCommentsManyText,
  });

  const isSelected = useSelect(
    (select) => select(blockEditorStore).getSelectedBlockClientId() === clientId,
    [clientId]
  );

  if (isSelected) {
    return (
      <EditSelected
        {...props}
        previewValues={previewValues}
        previewError={previewError}
        postMetaOptions={postMetaOptions}
        termMetaOptionsByTax={termMetaOptionsByTax}
        userMetaOptions={userMetaOptions}
      />
    );
  }

  return <EditCanvas {...props} previewValues={previewValues} />;
}
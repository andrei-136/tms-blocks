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
  Button,
  Modal,
  TabPanel,
  TextareaControl,
  ToggleControl,
  ToolbarButton,
  ToolbarGroup,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { customStyleToCSSString, getModificationLevel, hasModifiedStyleProps, computeNextStyle, getCustomSelectorsLevel } from '../../../shared/src/style-utils';
import { useCustomStyle, useUniqueId, useDynamicField, useBreakpointStyles, useCustomSelectorsStyle } from '../../../shared/src/hooks';
import {
  StyleControls, IdentityControls,
  AriaControls, BreakpointSelector, CustomAttributesControls, CustomSelectorsControls, ControlLabel, TagControls, TruncateControls, TransitionControls, ContentControls,
} from '../../../shared/src/controls';
import PanelTitle from '../../../shared/src/controls/PanelTitle';
import DynamicFieldSettings from '../../../shared/src/controls/DynamicFieldSettings';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

// -- Constants ----------------------------------------------------------------

const PARAGRAPH_TAG_OPTIONS = [
  { label: 'Paragraph (p)', value: 'p' },
  { label: 'Figcaption',    value: 'figcaption' },
];

const PARAGRAPH_STYLE_EXCLUDE = ['Transition'];

// -- Helpers ------------------------------------------------------------------

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

const truncatePreview = (value, { enabled, length, unit, suffix }) => {
  if (!enabled || typeof value !== 'string') return value;
  const plain = value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  const safeLength = Math.max(0, Number(length) || 0);
  if (safeLength === 0) return suffix || '';
  if (unit === 'words') {
    const words = plain.split(' ');
    if (words.length <= safeLength) return value;
    return `${words.slice(0, safeLength).join(' ')}${suffix || ''}`;
  }
  if (plain.length <= safeLength) return value;
  let truncated = plain.slice(0, safeLength).trim();
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > Math.floor(safeLength / 2)) truncated = truncated.slice(0, lastSpace);
  return `${truncated.replace(/[,(]+$/g, '')}${suffix || ''}`;
};

// -- Shared style hook --------------------------------------------------------

function useParagraphStyle({ uniqueId, clientId, customStyle, responsiveStyle, breakpointOverrides, customBreakpoints }) {
  const uniqueClassName = uniqueId ? `tmsblocks-paragraph-${uniqueId}` : '';

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
    id: `tmsblocks-paragraph-${clientId}`,
    css: uniqueClassName
      ? [
          cssString ? `.editor-styles-wrapper .${uniqueClassName} { ${cssString} }` : '',
          cssStringResponsive,
        ].filter(Boolean).join('\n')
      : '',
  });

  return uniqueClassName;
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

  const isBaseModified  = hasModifiedStyleProps(base.style,  Object.keys(base.style  || {}));
  const isHoverModified = hasModifiedStyleProps(hover.style, Object.keys(hover.style || {}));
  const isFocusModified = hasModifiedStyleProps(focus.style, Object.keys(focus.style || {}));

  // Compute master styles for comparison (same breakpoint / state as the instance).
  const masterBaseStyle  = masterAttributes
    ? (isDesktop ? (masterAttributes.customStyle             ?? {}) : (masterAttributes.responsiveStyle?.[activeBreakpoint]?.base         ?? {}))
    : null;
  const masterHoverStyle = masterAttributes
    ? (isDesktop ? (masterAttributes.customStyleHover        ?? {}) : (masterAttributes.responsiveStyle?.[activeBreakpoint]?.hover        ?? {}))
    : null;
  const masterFocusStyle = masterAttributes
    ? (isDesktop ? (masterAttributes.customStyleFocusVisible ?? {}) : (masterAttributes.responsiveStyle?.[activeBreakpoint]?.focusVisible ?? {}))
    : null;

  const tabs = [
    { name: 'base',          title: <ControlLabel label="Base"          isSet={isBaseModified}  /> },
    { name: 'hover',         title: <ControlLabel label="Hover"         isSet={isHoverModified} /> },
    { name: 'focus-visible', title: <ControlLabel label="Focus-Visible" isSet={isFocusModified} /> },
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
              exclude={PARAGRAPH_STYLE_EXCLUDE}
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
              exclude={PARAGRAPH_STYLE_EXCLUDE}
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
              blockClassName={attributes.uniqueId ? `.tmsblocks-paragraph-${attributes.uniqueId}` : ''}
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
                  exclude={['Transition']}
                  masterStyle={masterAttributes ? (masterEntry?.customStyle || {}) : null}
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
            exclude={PARAGRAPH_STYLE_EXCLUDE}
            masterStyle={masterBaseStyle}
            masterAttributes={masterAttributes}
          />
        );
      }}
    </TabPanel>
  );
}

// -- EditCanvas ---------------------------------------------------------------

function EditCanvas({ attributes, setAttributes, clientId, onReplace, mergeBlocks, previewValues }) {
  const {
    uniqueId,
    tagName         = 'p',
    content         = '',
    truncateEnabled = false,
    truncateLength  = 200,
    truncateUnit    = 'characters',
    truncateSuffix  = '...',
    anchorId,
    tmsClassName    = '',
    ariaLabel,
    ariaRole,
    customStyle         = {},
    responsiveStyle     = {},
    breakpointOverrides = {},
    customBreakpoints   = [],
    isDynamic       = false,
    dynamicPath     = '',
    separator       = '',
  } = attributes;

  const uniqueClassName   = useParagraphStyle({ uniqueId, clientId, customStyle, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();

  useCustomSelectorsStyle({ uniqueId, clientId, classPrefix: 'tmsblocks-paragraph', customSelectors: attributes.customSelectors || {}, breakpointOverrides: attributes.breakpointOverrides || {}, customBreakpoints: attributes.customBreakpoints || [] });

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole  || undefined,
  });

  if (isDynamic) {
    const previewHtml = previewValues.length ? previewValues.join(separator || ', ') : null;
    const previewDisplayHtml = truncatePreview(previewHtml || '', {
      enabled: truncateEnabled, length: truncateLength, unit: truncateUnit, suffix: truncateSuffix,
    });
    const TagName = tagName === 'figcaption' ? 'figcaption' : 'p';
    return (
      <TagName {...blockProps}>
        {previewDisplayHtml
          ? <span dangerouslySetInnerHTML={{ __html: previewDisplayHtml }} />
          : <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
              {dynamicPath || 'Dynamic paragraph - path not set'}
            </span>
        }
      </TagName>
    );
  }

  const textTag        = tagName === 'figcaption' ? 'figcaption' : 'p';
  const displayContent = truncatePreview(content, {
    enabled: truncateEnabled, length: truncateLength, unit: truncateUnit, suffix: truncateSuffix,
  });

  return (
    <RichText
      allowedFormats={['core/bold', 'core/italic', 'core/link', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
      {...blockProps}
      identifier="content"
      tagName={textTag}
      value={displayContent}
      onChange={(newContent) => setAttributes({ content: newContent })}
      placeholder="Write paragraph..."
      keepPlaceholderOnFocus
      onMerge={mergeBlocks}
      onReplace={onReplace}
    />
  );
}

// -- EditSelected -------------------------------------------------------------

function EditSelected({
  attributes,
  setAttributes,
  clientId,
  onReplace,
  mergeBlocks,
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
    tagName              = 'p',
    content              = '',
    anchorId,
    tmsClassName         = '',
    ariaLabel,
    ariaRole,
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
    truncateEnabled      = false,
    truncateLength       = 200,
    truncateUnit         = 'characters',
    truncateSuffix       = '...',
    sourcePostType       = '',
    sourcePostId         = 0,
    postSource           = 'current',
  } = attributes;

  const customStyleTextAlign = typeof customStyle.textAlign === 'object' && customStyle.textAlign !== null
    ? customStyle.textAlign.value
    : customStyle.textAlign;

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

  // -- Modified indicators ----------------------------------------------------

  const baseKeys             = useMemo(() => Object.keys(customStyle || {}), [customStyle]);
  const isBaseModified       = hasModifiedStyleProps(customStyle, baseKeys);
  const isResponsiveModified = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );

  const desktopLevel      = getModificationLevel(customStyle,             baseKeys,  masterAttributes ? (masterAttributes.customStyle             ?? {}) : null);

  // Breakpoint-level dots
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

  const responsiveMaxLevel = useMemo(() => {
    let max = 0;
    for (const key of Object.keys(responsiveStyle || {})) {
      max = Math.max(max, getBreakpointLevel(key));
    }
    return max;
  }, [getBreakpointLevel, responsiveStyle]);

  const stylesTabLevel = Math.max(desktopLevel, responsiveMaxLevel);

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

  // Wrapper tab dot: aggregate override level across all wrapper attributes
  const wrapperTabLevel = useMemo(() => {
    if (!masterAttributes) return 0;
    const attrNames = ['tagName', 'anchorId', 'tmsClassName', 'ariaLabel', 'ariaRole'];
    let maxLevel = 0;
    for (const key of attrNames) {
      const def = key === 'tagName' ? 'p' : '';
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

  const uniqueClassName   = useParagraphStyle({ uniqueId, clientId, customStyle, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();

  useCustomSelectorsStyle({ uniqueId, clientId, classPrefix: 'tmsblocks-paragraph', customSelectors: attributes.customSelectors || {}, breakpointOverrides: attributes.breakpointOverrides || {}, customBreakpoints: attributes.customBreakpoints || [] });

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole  || undefined,
  });

  // -- Preview values ---------------------------------------------------------

  const previewHtml        = previewValues.length ? previewValues.join(separator || ', ') : '';
  const previewDisplayHtml = truncatePreview(previewHtml || '', {
    enabled: truncateEnabled, length: truncateLength, unit: truncateUnit, suffix: truncateSuffix,
  });
  const truncatedDisplayContent = truncatePreview(content, {
    enabled: truncateEnabled, length: truncateLength, unit: truncateUnit, suffix: truncateSuffix,
  });

  const SelectedTag = tagName === 'figcaption' ? 'figcaption' : 'p';

  return (
    <>
      {!isDynamic && (
        <BlockControls>
          <AlignmentToolbar
            value={customStyleTextAlign || ''}
            onChange={(newAlign) => updateCustomStyle('textAlign', newAlign || null)}
          />
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
        </BlockControls>
      )}

      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-paragraph-top-tabs tmsblocks-inspector-top-tabs"
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
                      <ToggleControl
                        label={<ControlLabel label="Use dynamic content" level={dynamicLevel} />}
                        checked={isDynamic}
                        onChange={(next) => {
                          if (next) {
                            setAttributes({ isDynamic: true });
                          } else {
                            setAttributes({
                              isDynamic:               false,
                              dynamicSteps:            [],
                              dynamicPath:             '',
                              dynamicDateFormat:       '',
                              dynamicCommentsNoText:   '',
                              dynamicCommentsOneText:  '',
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
                          previewValue={previewHtml || previewError || ''}
                          previewHelp=""
                          masterAttributes={masterAttributes}
                        />
                      )}
                    </div>

                    <TagControls attributes={attributes} setAttributes={setAttributes} tagNameOptions={PARAGRAPH_TAG_OPTIONS} masterAttributes={masterAttributes} />
                    <TruncateControls
                      attributes={attributes}
                      setAttributes={setAttributes}
                      preview={isDynamic ? previewDisplayHtml : truncatedDisplayContent}
                      masterAttributes={masterAttributes}
                    />
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
        <SelectedTag {...blockProps}>
          {previewDisplayHtml
            ? <span dangerouslySetInnerHTML={{ __html: previewDisplayHtml }} />
            : <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
                {dynamicPath || resolvedPath ? '...' : 'Dynamic paragraph - path not set'}
              </span>
          }
        </SelectedTag>
      ) : (
        <>
          <RichText
            allowedFormats={['core/bold', 'core/italic', 'core/link', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
            {...blockProps}
            identifier="content"
            tagName={tagName === 'figcaption' ? 'figcaption' : 'p'}
            value={content}
            onChange={(newContent) => setAttributes({ content: newContent })}
            placeholder="Write paragraph..."
            keepPlaceholderOnFocus
            onMerge={mergeBlocks}
            onReplace={onReplace}
          />
        </>
      )}

      {isHtmlModalOpen && (
        <Modal
          title="Edit paragraph HTML"
          onRequestClose={() => setIsHtmlModalOpen(false)}
          shouldCloseOnClickOutside={false}
        >
          <div style={{ width: 'min(960px, 90vw)', maxWidth: '960px' }}>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              Edit the raw paragraph HTML in a larger writing area. The canvas will keep showing the rendered block.
            </p>
            <TextareaControl
              label="Paragraph HTML"
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
    path:             isDynamic ? previewPath : '',
    postId:           isDynamic ? currentPostId : 0,
    postType:         currentPostType,
    dateFormat:       dynamicDateFormat,
    commentsNoText:   dynamicCommentsNoText,
    commentsOneText:  dynamicCommentsOneText,
    commentsManyText: dynamicCommentsManyText,
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
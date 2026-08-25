import React, { useMemo, useCallback, useState } from 'react';
import {
  InspectorControls,
  useBlockProps,
  useInnerBlocksProps,
  useStyleOverride,
  MediaUpload,
  MediaUploadCheck,
} from '@wordpress/block-editor';
import {
  Button,
  Notice,
  SelectControl,
  TabPanel,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { usePostTypeOptions, PostSearchSelector, SelectedPostPreview } from '../../../shared/src/controls/PostSearchSelector';
import ControlLabel from '../../../shared/src/controls/ControlLabel';
import PanelTitle from '../../../shared/src/controls/PanelTitle';

import StyleControls from '../../../shared/src/controls/StyleControls';
import IdentityControls from '../../../shared/src/controls/IdentityControls';
import AriaControls from '../../../shared/src/controls/AriaControls';
import CustomAttributesControls from '../../../shared/src/controls/CustomAttributesControls';
import CustomSelectorsControls from '../../../shared/src/controls/CustomSelectorsControls';
import BreakpointSelector from '../../../shared/src/controls/BreakpointSelector';
import TagControls from '../../../shared/src/controls/TagControls';
import TransitionControls, { DEFAULT_GLOBAL as TRANSITION_DEFAULT_GLOBAL } from '../../../shared/src/controls/TransitionControls';
import ContentControls from '../../../shared/src/controls/ContentControls';
import {
  customStyleToInlineStyle,
  customStyleToCSSString,
  getModificationLevel,
  hasModifiedStyleProps,
  computeNextStyle,
  getCustomSelectorsLevel,
} from '../../../shared/src/style-utils';
import useCustomStyle from '../../../shared/src/hooks/useCustomStyle';
import useUniqueId from '../../../shared/src/hooks/useUniqueId';
import useBreakpointStyles from '../../../shared/src/hooks/useBreakpointStyles';
import useCustomSelectorsStyle from '../../../shared/src/hooks/useCustomSelectorsStyle';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

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
  transitionConfig,
  setTransitionConfig,
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

  const POST_CONTEXT_EXCLUDE = ['BackgroundImage', 'Image', 'List', 'ListItem', 'Wrapper', 'Anchor', 'ClassName', 'Transition'];

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
            <>
              {isDesktop && (
                <TransitionControls
                  customStyle={customStyle}
                  updateCustomStyle={updateCustomStyle}
                  stateStyles={{ hover: customStyleHover, focusVisible: customStyleFocusVisible }}
                  transitionConfig={transitionConfig}
                  setTransitionConfig={setTransitionConfig}
                  masterTransitionConfig={masterAttributes?.transitionConfig ?? null}
                />
              )}
              <StyleControls
                updateCustomStyle={hover.updater}
                attributes={{ ...attributes, customStyle: hover.style }}
                setAttributes={(p) => {
                  if (p.customStyle !== undefined) hover.updater(p.customStyle);
                  else setAttributes(p);
                }}
                clientId={clientId}
                exclude={POST_CONTEXT_EXCLUDE}
                controlProps={{ Display: { useUtilityClasses: false } }}
                masterStyle={masterHoverStyle}
                masterAttributes={masterAttributes}
              />
            </>
          );
        }

        if (tab.name === 'focus-visible') {
          return (
            <>
              {isDesktop && (
                <TransitionControls
                  customStyle={customStyle}
                  updateCustomStyle={updateCustomStyle}
                  stateStyles={{ hover: customStyleHover, focusVisible: customStyleFocusVisible }}
                  transitionConfig={transitionConfig}
                  setTransitionConfig={setTransitionConfig}
                  masterTransitionConfig={masterAttributes?.transitionConfig ?? null}
                />
              )}
              <StyleControls
                updateCustomStyle={focus.updater}
                attributes={{ ...attributes, customStyle: focus.style }}
                setAttributes={(p) => {
                  if (p.customStyle !== undefined) focus.updater(p.customStyle);
                  else setAttributes(p);
                }}
                clientId={clientId}
                exclude={POST_CONTEXT_EXCLUDE}
                controlProps={{ Display: { useUtilityClasses: false } }}
                masterStyle={masterFocusStyle}
                masterAttributes={masterAttributes}
              />
            </>
          );
        }

        if (tab.name === 'custom-css') {
          return (
            <CustomSelectorsControls
              customSelectors={attributes.customSelectors || []}
              onChange={(next) => setAttributes({ customSelectors: next })}
              blockClassName={attributes.uniqueId ? `.tmsblocks-post-context-${attributes.uniqueId}` : ''}
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
                  exclude={['Transition']}
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
            setAttributes={(p) => {
              if (p.customStyle !== undefined) base.updater(p.customStyle);
              else setAttributes(p);
            }}
            clientId={clientId}
            masterStyle={masterBaseStyle}
            masterAttributes={masterAttributes}
            controlProps={{
              Display: { showCursor: true },
              ...(isDesktop ? {
                Transition: {
                  stateStyles: { hover: customStyleHover, focusVisible: customStyleFocusVisible },
                  transitionConfig,
                  setTransitionConfig,
                },
              } : {}),
            }}
          />
        );
      }}
    </TabPanel>
  );
}

// -- Main Edit ----------------------------------------------------------------

export default function Edit({ attributes, setAttributes, clientId, masterAttributes }) {
  const {
    contextPostType,
    contextPostId,
    renderBlock,
    uniqueId,
    tagName                 = 'div',
    customStyle             = {},
    customStyleHover        = {},
    customStyleFocusVisible = {},
    responsiveStyle         = {},
    breakpointOverrides     = {},
    customBreakpoints       = [],
    transitionConfig        = {},
    tmsClassName            = '',
    anchorId                = '',
  } = attributes;

  const { options: postTypeOptions, restBaseBySlug } = usePostTypeOptions();
  const isContextModified = contextPostId > 0;

  useUniqueId({ uniqueId, clientId, setAttributes });
  useCustomSelectorsStyle({ uniqueId, clientId, classPrefix: 'tmsblocks-post-context', customSelectors: attributes.customSelectors || [] });

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle             = useCustomStyle(customStyle,             setAttributes);
  const updateCustomStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateCustomStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const setTransitionConfig           = useCallback((v) => setAttributes({ transitionConfig: v }), [setAttributes]);
  const { getUpdater, getStyle }      = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Editor CSS -------------------------------------------------------------

  const uniqueClass = uniqueId ? `tmsblocks-post-context-${uniqueId}` : '';

  const cssStringResponsive = useMemo(() => {
    if (!uniqueClass) return '';
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
      if (base)  lines.push(`@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClass} { ${base} } }`);
      if (hover) lines.push(`@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClass}:hover { ${hover} } }`);
      if (focus) lines.push(`@media (max-width: ${maxWidth}px) { .editor-styles-wrapper .${uniqueClass}:focus-visible { ${focus} } }`);
      return lines.join('\n');
    }).join('\n');
  }, [uniqueClass, responsiveStyle, breakpointOverrides, customBreakpoints]);

  useStyleOverride({
    id: `tmsblocks-post-context-${clientId}`,
    css: uniqueClass
      ? [
          customStyleToCSSString(customStyle)             ? `.editor-styles-wrapper .${uniqueClass} { ${customStyleToCSSString(customStyle)} }`                           : '',
          customStyleToCSSString(customStyleHover)        ? `.editor-styles-wrapper .${uniqueClass}:hover { ${customStyleToCSSString(customStyleHover)} }`                : '',
          customStyleToCSSString(customStyleFocusVisible) ? `.editor-styles-wrapper .${uniqueClass}:focus-visible { ${customStyleToCSSString(customStyleFocusVisible)} }` : '',
          cssStringResponsive,
        ].filter(Boolean).join('\n')
      : '',
  });

  // -- Breakpoint tabs --------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

  const allBreakpoints = useMemo(() =>
    resolveBreakpoints(breakpointOverrides, Object.keys(responsiveStyle || {}), customBreakpoints),
    [breakpointOverrides, responsiveStyle, customBreakpoints]
  );

  // -- Modified indicators ----------------------------------------------------

  const transitionGlobal = transitionConfig?.global || {};
  const hasTransitionChanges =
    Object.entries(TRANSITION_DEFAULT_GLOBAL).some(([k, def]) => transitionGlobal[k] !== undefined && transitionGlobal[k] !== def) ||
    Object.keys(transitionConfig?.overrides || {}).length > 0 ||
    Object.values(transitionConfig?.states  || {}).some((s) => s?.linked === false || (s?.unlinkedProperties || []).length > 0);

  const isBaseModified         = hasModifiedStyleProps(customStyle,             Object.keys(customStyle             || {})) || hasTransitionChanges;
  const isHoverModified        = hasModifiedStyleProps(customStyleHover,        Object.keys(customStyleHover        || {}));
  const isFocusVisibleModified = hasModifiedStyleProps(customStyleFocusVisible, Object.keys(customStyleFocusVisible || {}));
  const isResponsiveModified   = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );

  const baseKeys     = Object.keys(customStyle || {});
  const desktopLevel = getModificationLevel(customStyle, baseKeys, masterAttributes ? (masterAttributes.customStyle ?? {}) : null);

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

  const stylesTabLevel = Math.max(desktopLevel, responsiveMaxLevel, hasTransitionChanges ? 1 : 0);

  // Wrapper tab dot: aggregate override level across all wrapper attributes.
  const wrapperTabLevel = useMemo(() => {
    if (!masterAttributes) return 0;
    const attrNames = ['contextPostType', 'contextPostId', 'tagName', 'anchorId', 'tmsClassName', 'ariaLabel', 'ariaRole'];
    let maxLevel = 0;
    for (const key of attrNames) {
      const def = key === 'contextPostType' ? 'post'
        : key === 'contextPostId' ? 0
        : key === 'tagName' ? 'div'
        : '';
      const inst = attributes[key] ?? def;
      const master = masterAttributes[key] ?? def;
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

  // Post context dots — same wrapper convention (defaults: postType 'post', postId 0).
  const contextPostTypeDot = masterAttributes
    ? ((contextPostType === 'post' && (masterAttributes.contextPostType ?? 'post') === 'post')
        ? 0
        : (contextPostType === (masterAttributes.contextPostType ?? 'post') ? 2 : 3))
    : 0;
  const contextPostIdDot = masterAttributes
    ? ((contextPostId === 0 && (masterAttributes.contextPostId ?? 0) === 0)
        ? 0
        : (contextPostId === (masterAttributes.contextPostId ?? 0) ? 2 : 3))
    : 0;


  // -- Block props ------------------------------------------------------------

  const combinedClassName = [tmsClassName, uniqueClass].filter(Boolean).join(' ');

  const blockProps = useBlockProps({
    id:        anchorId || undefined,
    className: combinedClassName || undefined,
    style: {
      outline:       '1px dashed #b0b0b0',
      outlineOffset: '2px',
      padding:       '4px',
      position:      'relative',
      ...customStyleToInlineStyle(customStyle),
    },
  });

  const innerBlocksProps = useInnerBlocksProps({}, {});

  // -- Render -----------------------------------------------------------------

  return (
    <>
      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-post-context-top-tabs tmsblocks-inspector-top-tabs"
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
                        label={<ControlLabel label="Post Type" level={contextPostTypeDot} />}
                        value={contextPostType}
                        options={postTypeOptions}
                        onChange={(val) => setAttributes({ contextPostType: val, contextPostId: 0 })}
                      />

                      {contextPostId > 0 && (
                        <SelectedPostPreview
                          postType={contextPostType}
                          postId={contextPostId}
                          onClear={() => setAttributes({ contextPostId: 0 })}
                        />
                      )}
  
                      {contextPostType === 'attachment' ? (
                        <>
                          <div style={{ marginBottom: '8px' }}>
                            <ControlLabel label="Media" level={contextPostIdDot} />
                          </div>
                          <MediaUploadCheck>
                            <MediaUpload
                              onSelect={(media) => setAttributes({ contextPostId: media?.id ? parseInt(media.id, 10) : 0 })}
                              value={contextPostId || 0}
                              render={({ open }) => (
                                <Button variant="secondary" onClick={open}>
                                  {contextPostId > 0 ? 'Replace media' : 'Select media'}
                                </Button>
                              )}
                            />
                          </MediaUploadCheck>
                        </>
                      ) : (
                        <PostSearchSelector
                          postType={contextPostType}
                          restBaseBySlug={restBaseBySlug}
                          value={contextPostId}
                          onChange={(id) => setAttributes({ contextPostId: id })}
                          level={contextPostIdDot}
                        />
                      )}

                      {contextPostId === 0 && (
                        <Notice status="warning" isDismissible={false} style={{ marginTop: '8px' }}>
                          No post selected. Children will receive no context.
                        </Notice>
                      )}
                    </div>
                      <TagControls           attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                      <AriaControls          attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                      <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                       <IdentityControls      attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
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
                    isDesktopModified={isBaseModified || isHoverModified || isFocusVisibleModified || getCustomSelectorsLevel(attributes.customSelectors, masterAttributes, 'desktop') > 0}
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
                    transitionConfig={transitionConfig}
                    setTransitionConfig={setTransitionConfig}
                    masterAttributes={masterAttributes}
                  />
                </>
              );
            }}
          </TabPanel>
        </div>
      </InspectorControls>

      <div {...blockProps}>
        <span style={{
          position:     'absolute',
          top:          '2px',
          left:         '4px',
          fontSize:     '10px',
          fontFamily:   'monospace',
          color:        '#999',
          pointerEvents: 'none',
          userSelect:   'none',
        }}>
          Post Context{contextPostId > 0 ? ` #${contextPostId}` : ' - unset'}
        </span>
        <div style={{ paddingTop: '16px' }}>
          <div {...innerBlocksProps} />
        </div>
      </div>
    </>
  );
}
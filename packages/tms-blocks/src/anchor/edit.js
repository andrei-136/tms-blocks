import React, { useMemo, useCallback, useState } from 'react';
import {
  useBlockProps,
  InspectorControls,
  ButtonBlockAppender,
  useInnerBlocksProps,
  useStyleOverride,
  store as blockEditorStore,
  RichText,
} from '@wordpress/block-editor';
import { Notice, TabPanel, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
  StyleControls, IdentityControls,
  AriaControls, BreakpointSelector, CustomAttributesControls, ControlLabel, CustomSelectorsControls,
  TransitionControls, TRANSITION_DEFAULT_GLOBAL,
} from '../../../shared/src/controls';
import AnchorSettings from '../../../shared/src/controls/AnchorSettings';
import { useCustomStyle, useUniqueId, useBreakpointStyles, useDynamicField, useCustomSelectorsStyle } from '../../../shared/src/hooks';
import { customStyleToCSSString, getModificationLevel, hasModifiedStyleProps, computeNextStyle, getCustomSelectorsLevel } from '../../../shared/src/style-utils';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

// -- Role options --------------------------------------------------------------

const ANCHOR_ROLE_OPTIONS = [
  { label: 'None',              value: '' },
  { label: 'button',            value: 'button' },
  { label: 'checkbox',          value: 'checkbox' },
  { label: 'menuitem',          value: 'menuitem' },
  { label: 'menuitemcheckbox',  value: 'menuitemcheckbox' },
  { label: 'menuitemradio',     value: 'menuitemradio' },
  { label: 'option',            value: 'option' },
  { label: 'radio',             value: 'radio' },
  { label: 'switch',            value: 'switch' },
  { label: 'tab',               value: 'tab' },
  { label: 'treeitem',          value: 'treeitem' },
];

// -- Shared exclude list for anchor StyleControls -----------------------------

const ANCHOR_STYLE_EXCLUDE = ['BackgroundImage', 'Image', 'List', 'ListItem', 'Wrapper', 'Anchor', 'ClassName'];
// Transition is excluded from hover/focus StyleControls because it is rendered
// separately via <TransitionControls> on those tabs. The base tab includes it.

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

function useAnchorStyles({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints }) {
  const uniqueClassName = uniqueId ? `tmsblocks-anchor-${uniqueId}` : '';

  const cssString             = useMemo(() => customStyleToCSSString(customStyle),             [customStyle]);
  const cssStringHover        = useMemo(() => customStyleToCSSString(customStyleHover),        [customStyleHover]);
  const cssStringFocusVisible = useMemo(() => customStyleToCSSString(customStyleFocusVisible), [customStyleFocusVisible]);

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

  const overrideCss = useMemo(() => {
    if (!uniqueClassName) return '';
    return [
      cssString             ? `.editor-styles-wrapper .${uniqueClassName} { ${cssString} }`                           : '',
      cssStringHover        ? `.editor-styles-wrapper .${uniqueClassName}:hover { ${cssStringHover} }`                : '',
      cssStringFocusVisible ? `.editor-styles-wrapper .${uniqueClassName}:focus-visible { ${cssStringFocusVisible} }` : '',
      cssStringResponsive,
    ].filter(Boolean).join('\n');
  }, [uniqueClassName, cssString, cssStringHover, cssStringFocusVisible, cssStringResponsive]);

  useStyleOverride({ id: `tmsblocks-anchor-${clientId}`, css: overrideCss });

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
                setAttributes={(patch) => {
                  if (patch.customStyle !== undefined) hover.updater(patch.customStyle);
                  else setAttributes(patch);
                }}
                clientId={clientId}
                exclude={[...ANCHOR_STYLE_EXCLUDE, 'Transition']}
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
                setAttributes={(patch) => {
                  if (patch.customStyle !== undefined) focus.updater(patch.customStyle);
                  else setAttributes(patch);
                }}
                clientId={clientId}
                exclude={[...ANCHOR_STYLE_EXCLUDE, 'Transition']}
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
              blockClassName={attributes.uniqueId ? `.tmsblocks-anchor-${attributes.uniqueId}` : ''}
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
            exclude={ANCHOR_STYLE_EXCLUDE}
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

// -- EditCanvas ---------------------------------------------------------------

function EditCanvas({
  attributes,
  setAttributes,
  clientId,
  hasAnchorBlockInParents,
  innerTextPreviewValues = [],
  innerTextPreviewError = '',
}) {
  const {
    uniqueId,
    anchorId,
    tmsClassName         = '',
    utilityClasses       = '',
    className            = '',
    customStyle          = {},
    customStyleHover     = {},
    customStyleFocusVisible = {},
    responsiveStyle      = {},
    breakpointOverrides  = {},
    customBreakpoints    = [],
    innerText            = '',
    isInnerTextDynamic   = false,
    innerTextDynamicPath = '',
    innerTextDynamicSteps = [],
  } = attributes;

  const uniqueClassName   = useAnchorStyles({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, utilityClasses, className, uniqueClassName].filter(Boolean).join(' ').trim();

  const blockProps       = useBlockProps({ id: anchorId || undefined, className: combinedClassName || undefined });
  const innerBlocksProps = useInnerBlocksProps({}, { renderAppender: false });

  const hasInnerBlocks = useSelect((select) =>
    (select(blockEditorStore).getBlock(clientId)?.innerBlocks?.length ?? 0) > 0,
  [clientId]);

  const resolvedInnerTextPath = useMemo(() => stepsToPath(innerTextDynamicSteps), [innerTextDynamicSteps]);
  const dynamicInnerTextValue = innerTextPreviewValues
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ');
  const dynamicInnerTextPlaceholder = innerTextPreviewError || resolvedInnerTextPath || innerTextDynamicPath || 'Dynamic label - path not set';
  const shouldRenderLabel = isInnerTextDynamic || !!innerText?.trim() || !hasInnerBlocks;

  return (
    <div {...blockProps} style={{ pointerEvents: 'none' }}>
      {hasAnchorBlockInParents && (
        <Notice status="error" isDismissible={false}>
          This anchor block is nested inside another anchor block. Nesting anchor blocks is not allowed.
        </Notice>
      )}
      {shouldRenderLabel && (
        isInnerTextDynamic ? (
          dynamicInnerTextValue ? (
            <span dangerouslySetInnerHTML={{ __html: dynamicInnerTextValue }} />
          ) : (
            <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
              {dynamicInnerTextPlaceholder}
            </span>
          )
        ) : (
          <RichText
            allowedFormats={['core/bold', 'core/italic', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
            tagName="span"
            value={innerText}
            onChange={(value) => setAttributes({ innerText: value })}
            placeholder="Add label text or insert blocks..."
            style={{ pointerEvents: 'auto' }}
          />
        )
      )}
      <div {...innerBlocksProps} style={{ pointerEvents: 'auto' }} />
    </div>
  );
}

// -- EditSelected -------------------------------------------------------------

function EditSelected({
  attributes,
  setAttributes,
  clientId,
  context,
  hasAnchorBlockInParents,
  innerTextPreviewValues = [],
  innerTextPreviewError = '',
  masterAttributes,
}) {
  const {
    uniqueId,
    anchorId,
    tmsClassName         = '',
    utilityClasses       = '',
    className            = '',
    customStyle          = {},
    customStyleHover     = {},
    customStyleFocusVisible = {},
    responsiveStyle      = {},
    breakpointOverrides  = {},
    customBreakpoints    = [],
    innerText            = '',
    isInnerTextDynamic   = false,
    innerTextDynamicPath = '',
    innerTextDynamicSteps = [],
    transitionConfig     = {},
    renderBlock          = true,
  } = attributes;

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle             = useCustomStyle(customStyle,             setAttributes, 'customStyle');
  const updateCustomStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateCustomStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const setTransitionConfig           = useCallback((next) => setAttributes({ transitionConfig: next }), [setAttributes]);
  const { getUpdater, getStyle }      = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Breakpoint tabs --------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

  const allBreakpoints = useMemo(() =>
    resolveBreakpoints(breakpointOverrides, Object.keys(responsiveStyle || {}), customBreakpoints),
    [breakpointOverrides, responsiveStyle, customBreakpoints]
  );

  // -- Modified indicators ----------------------------------------------------

  const baseKeys             = useMemo(() => Object.keys(customStyle || {}),             [customStyle]);
  const hoverKeys            = useMemo(() => Object.keys(customStyleHover || {}),        [customStyleHover]);
  const focusKeys            = useMemo(() => Object.keys(customStyleFocusVisible || {}), [customStyleFocusVisible]);
  const isBaseModified       = hasModifiedStyleProps(customStyle, baseKeys);

  const isResponsiveModified = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );

  const transitionGlobal = useMemo(() => transitionConfig?.global || {}, [transitionConfig]);
  const hasTransitionPanelChanges = useMemo(() => {
    const overridesCount     = Object.keys(transitionConfig?.overrides || {}).length;
    const hasStateOverrides  = Object.values(transitionConfig?.states  || {}).some(
      (s) => s && (s.linked === false || (s.unlinkedProperties || []).length > 0)
    );
    const hasGlobalOverrides = Object.entries(TRANSITION_DEFAULT_GLOBAL).some(
      ([key, def]) => transitionGlobal[key] !== undefined && transitionGlobal[key] !== def
    );
    return hasGlobalOverrides || overridesCount > 0 || hasStateOverrides;
  }, [transitionConfig, transitionGlobal]);

  const desktopLevel      = getModificationLevel(customStyle,             baseKeys,  masterAttributes ? (masterAttributes.customStyle             ?? {}) : null);
  const hoverDesktopLevel  = getModificationLevel(customStyleHover,        hoverKeys, masterAttributes ? (masterAttributes.customStyleHover        ?? {}) : null);
  const focusDesktopLevel  = getModificationLevel(customStyleFocusVisible, focusKeys, masterAttributes ? (masterAttributes.customStyleFocusVisible ?? {}) : null);

  // Breakpoint-level dots: compare responsive styles against master's responsive styles.
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

  const stylesTabLevel = Math.max(desktopLevel, hoverDesktopLevel, focusDesktopLevel, responsiveMaxLevel, hasTransitionPanelChanges ? 1 : 0);

  // Wrapper tab dot: aggregate override level across all wrapper attributes
  const wrapperTabLevel = useMemo(() => {
    if (!masterAttributes) return 0;
    const attrNames = ['anchorId', 'tmsClassName', 'ariaLabel', 'ariaRole'];
    let maxLevel = 0;
    for (const key of attrNames) {
      const inst = attributes[key] || '';
      const master = masterAttributes[key] || '';
      if (!inst && !master) continue;
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

  const uniqueClassName   = useAnchorStyles({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, utilityClasses, className, uniqueClassName].filter(Boolean).join(' ').trim();

  const blockProps = useBlockProps({ id: anchorId || undefined, className: combinedClassName || undefined });

  const isDirectlySelected = useSelect((select) =>
    select(blockEditorStore).getSelectedBlockClientId() === clientId,
  [clientId]);

  const isTemplateLocked = useSelect((select) => {
    const block = select(blockEditorStore).getBlock(clientId);
    return block?.attributes?.templateLock === 'all';
  }, [clientId]);

  const innerBlocksProps = useInnerBlocksProps({}, {
    renderAppender: (isDirectlySelected && !isTemplateLocked)
      ? () => <ButtonBlockAppender className="tmsblocks-block-appender__button" rootClientId={clientId} />
      : false,
    defaultBlock: { name: 'tmsblocks/paragraph' },
    directInsert: false,
  });

  const hasInnerBlocks = useSelect((select) =>
    (select(blockEditorStore).getBlock(clientId)?.innerBlocks?.length ?? 0) > 0,
  [clientId]);

  const resolvedInnerTextPath = useMemo(() => stepsToPath(innerTextDynamicSteps), [innerTextDynamicSteps]);
  const dynamicInnerTextValue = innerTextPreviewValues
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(', ');
  const dynamicInnerTextPlaceholder = innerTextPreviewError || resolvedInnerTextPath || innerTextDynamicPath || 'Dynamic label - path not set';
  const shouldRenderLabel = isInnerTextDynamic || isDirectlySelected || !!innerText?.trim() || !hasInnerBlocks;

  return (
    <>
      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-anchor-top-tabs tmsblocks-inspector-top-tabs"
            tabs={[
              { name: 'wrapper', title: <ControlLabel label="Wrapper" level={wrapperTabLevel} /> },
              { name: 'styles',  title: <ControlLabel label="Styles"  level={stylesTabLevel} /> },
            ]}
          >
            {(tab) => {

              // -- Wrapper tab ----------------------------------------------
              if (tab.name === 'wrapper') {
                return (
                  <div style={{ backgroundColor: 'var(--tms-cold-white)', padding: '16px' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' }}>
                      <AnchorSettings
                        attributes={attributes}
                        setAttributes={setAttributes}
                        context={context}
                        masterAttributes={masterAttributes}
                      />
                    </div>
                      <AriaControls attributes={attributes} setAttributes={setAttributes} roleOptions={ANCHOR_ROLE_OPTIONS} masterAttributes={masterAttributes} />
                      <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                      <IdentityControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                  </div>
                );
              }

              // -- Styles tab -----------------------------------------------
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

      {hasAnchorBlockInParents && (
        <Notice status="error" isDismissible={false}>
          ?? This anchor block is nested inside another anchor block. Nesting anchor blocks is not allowed.
        </Notice>
      )}

      <div {...blockProps} style={{ pointerEvents: 'none' }}>
        {shouldRenderLabel && (
          isInnerTextDynamic ? (
            dynamicInnerTextValue ? (
              <span dangerouslySetInnerHTML={{ __html: dynamicInnerTextValue }} />
            ) : (
              <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
                {dynamicInnerTextPlaceholder}
              </span>
            )
          ) : (
            <RichText
              allowedFormats={['core/bold', 'core/italic', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
              tagName="span"
              value={innerText}
              onChange={(value) => setAttributes({ innerText: value })}
              placeholder="Add label text or insert blocks"
              style={{ pointerEvents: 'auto' }}
            />
          )
        )}
        <div {...innerBlocksProps} style={{ pointerEvents: 'auto' }} />
      </div>
    </>
  );
}

// -- Entry point --------------------------------------------------------------

export default function Edit(props) {
  const { clientId, attributes, setAttributes, context, masterAttributes } = props;
  const {
    uniqueId,
    isInnerTextDynamic = false,
    innerTextDynamicSteps = [],
    innerTextDynamicPath = '',
    innerTextDynamicDateFormat = '',
    innerTextDynamicCommentsNoText = '',
    innerTextDynamicCommentsOneText = '',
    innerTextDynamicCommentsManyText = '',
    sourcePostId = 0,
    sourcePostType = '',
    postSource = 'current',
  } = attributes;

  useUniqueId({ uniqueId, clientId, setAttributes });
  useCustomSelectorsStyle({ uniqueId, clientId, classPrefix: 'tmsblocks-anchor', customSelectors: attributes.customSelectors || [] });

  const editorPostId   = useSelect((select) => select('core/editor')?.getCurrentPostId?.() || 0, []);
  const editorPostType = useSelect((select) => select('core/editor')?.getCurrentPostType?.() || 'post', []);

  const currentPostType = postSource === 'specific'
    ? (sourcePostType || 'post')
    : (context?.['tmsblocks/contextPostType'] || context?.['tms/contextPostType'] || context?.postType || editorPostType);
  const currentPostId = postSource === 'specific'
    ? sourcePostId
    : (context?.['tmsblocks/contextPostId'] || context?.['tms/contextPostId'] || context?.postId || editorPostId);

  const resolvedInnerTextPath = useMemo(() => stepsToPath(innerTextDynamicSteps), [innerTextDynamicSteps]);
  const previewInnerTextPath = resolvedInnerTextPath || innerTextDynamicPath;

  const {
    previewValues: innerTextPreviewValues,
    previewError: innerTextPreviewError,
  } = useDynamicField({
    path: isInnerTextDynamic ? previewInnerTextPath : '',
    postId: isInnerTextDynamic ? currentPostId : 0,
    postType: currentPostType,
    dateFormat: innerTextDynamicDateFormat,
    commentsNoText: innerTextDynamicCommentsNoText,
    commentsOneText: innerTextDynamicCommentsOneText,
    commentsManyText: innerTextDynamicCommentsManyText,
  });

  const isSelected = useSelect((select) => {
    const store      = select(blockEditorStore);
    const selectedId = store.getSelectedBlockClientId();
    if (!selectedId) return false;
    const parents = store.getBlockParents(selectedId) || [];
    return selectedId === clientId || parents.includes(clientId);
  }, [clientId]);

  const hasAnchorBlockInParents = useSelect((select) => {
    const { getBlock, getBlockParents } = select(blockEditorStore);
    return getBlockParents(clientId).some((id) => getBlock(id)?.name === 'tmsblocks/anchor');
  }, [clientId]);

  if (isSelected) {
    return (
      <EditSelected
        {...props}
        hasAnchorBlockInParents={hasAnchorBlockInParents}
        innerTextPreviewValues={innerTextPreviewValues}
        innerTextPreviewError={innerTextPreviewError}
      />
    );
  }

  return (
    <EditCanvas
      {...props}
      hasAnchorBlockInParents={hasAnchorBlockInParents}
      innerTextPreviewValues={innerTextPreviewValues}
      innerTextPreviewError={innerTextPreviewError}
    />
  );
}
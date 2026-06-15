import React, { useMemo, useState } from 'react';
import {
  InspectorControls,
  useBlockProps,
  useInnerBlocksProps,
  useStyleOverride,
  ButtonBlockAppender,
  store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, TabPanel, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
  AriaControls,
  BreakpointSelector,
  ControlLabel,
  CustomAttributesControls,
  IdentityControls,
  PanelTitle,
  StyleControls,
  TagControls,
  TRANSITION_DEFAULT_GLOBAL as DEFAULT_TRANSITION_GLOBAL,
  TransitionControls,
} from '../../../shared/src/controls';
import { customStyleToCSSString, getModificationLevel, hasModifiedStyleProps } from '../../../shared/src/style-utils';
import { useCustomStyle, useUniqueId, useBreakpointStyles } from '../../../shared/src/hooks';
import { resolveBreakpoints, BREAKPOINTS } from '../../../shared/src/breakpoints';

// -- Breakpoint state tabs (Base / Hover / Focus-Visible) ---------------------

function BreakpointStateTabs({
  // Desktop styles + updaters
  customStyle,
  customStyleHover,
  customStyleFocusVisible,
  updateCustomStyle,
  updateCustomStyleHover,
  updateCustomStyleFocusVisible,
  // Responsive
  getUpdater,
  getStyle,
  activeBreakpoint,
  // Shared
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
    style:   isDesktop ? customStyleFocusVisible        : getStyle(activeBreakpoint, 'focusVisible'),
    updater: isDesktop ? updateCustomStyleFocusVisible  : getUpdater(activeBreakpoint, 'focusVisible'),
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
  ];

  return (
    <TabPanel
      className="tmsblocks-state-tabs"
      tabs={tabs}
    >
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
                  if (patch.customStyle !== undefined) {
                    hover.updater(patch.customStyle);
                  } else {
                    setAttributes(patch);
                  }
                }}
                clientId={clientId}
                exclude={['Transition']}
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
                  if (patch.customStyle !== undefined) {
                    focus.updater(patch.customStyle);
                  } else {
                    setAttributes(patch);
                  }
                }}
                clientId={clientId}
                exclude={['Transition']}
                controlProps={{ Display: { useUtilityClasses: false } }}
                masterStyle={masterFocusStyle}
                masterAttributes={masterAttributes}
              />
            </>
          );
        }

        // Base tab
        return (
          <StyleControls
            updateCustomStyle={base.updater}
            attributes={{ ...attributes, customStyle: base.style }}
            setAttributes={(patch) => {
              if (patch.customStyle !== undefined) {
                base.updater(patch.customStyle);
              } else {
                setAttributes(patch);
              }
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
    uniqueId,
    tagName,
    anchorId,
    tmsClassName,
    ariaLabel,
    role,
    customAttributes,
    customStyle          = {},
    customStyleFocusVisible = {},
    customStyleHover     = {},
    transitionConfig     = {},
    responsiveStyle      = {},
    breakpointOverrides  = {},
    customBreakpoints    = [],
    renderBlock          = true,
  } = attributes;

  useUniqueId({ uniqueId, clientId, setAttributes });

  const uniqueClassName = uniqueId ? `tmsblocks-generic-block-${uniqueId}` : '';

  // -- Editor styles ----------------------------------------------------------

  const cssString             = customStyleToCSSString(customStyle);
  const cssStringHover        = customStyleToCSSString(customStyleHover);
  const cssStringFocusVisible = customStyleToCSSString(customStyleFocusVisible);

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
    id: `tmsblocks-generic-block-${clientId}`,
    css: uniqueClassName
      ? [
          cssString             ? `.editor-styles-wrapper .${uniqueClassName} { ${cssString} }`             : '',
          cssStringHover        ? `.editor-styles-wrapper .${uniqueClassName}:hover { ${cssStringHover} }`  : '',
          cssStringFocusVisible ? `.editor-styles-wrapper .${uniqueClassName}:focus-visible { ${cssStringFocusVisible} }` : '',
          cssStringResponsive,
        ].filter(Boolean).join('\n')
      : ''
  });

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle             = useCustomStyle(customStyle,             setAttributes, 'customStyle');
  const updateCustomStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateCustomStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const setTransitionConfig           = (next) => setAttributes({ transitionConfig: next });

  const { getUpdater, getStyle } = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Breakpoint tabs --------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

  const allBreakpoints = useMemo(() =>
    resolveBreakpoints(breakpointOverrides, Object.keys(responsiveStyle || {}), customBreakpoints),
    [breakpointOverrides, responsiveStyle, customBreakpoints]
  );

  const isResponsiveModified = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );

  // -- Other ------------------------------------------------------------------

  const TagName = tagName || 'div';

  const combinedClassName = [tmsClassName, uniqueClassName]
    .filter(Boolean)
    .join(' ')
    .trim();



  const baseKeys             = Object.keys(customStyle          || {});
  const hoverKeys            = Object.keys(customStyleHover     || {});
  const focusKeys            = Object.keys(customStyleFocusVisible || {});
  const isBaseModified       = hasModifiedStyleProps(customStyle,             baseKeys);
  const desktopLevel         = getModificationLevel(customStyle, baseKeys, masterAttributes ? (masterAttributes.customStyle ?? {}) : null);

  // -- Styles tab dot: aggregate level across all desktop states + responsive --

  const hoverDesktopLevel  = getModificationLevel(customStyleHover,        hoverKeys, masterAttributes ? (masterAttributes.customStyleHover        ?? {}) : null);
  const focusDesktopLevel  = getModificationLevel(customStyleFocusVisible, focusKeys, masterAttributes ? (masterAttributes.customStyleFocusVisible ?? {}) : null);

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
  const isStyleTabModified = stylesTabLevel > 0;

  // Wrapper tab dot: aggregate override level across all wrapper attributes
  const wrapperTabLevel = useMemo(() => {
    if (!masterAttributes) return 0;
    const attrNames = ['tagName', 'anchorId', 'tmsClassName', 'ariaLabel', 'ariaRole'];
    let maxLevel = 0;
    for (const key of attrNames) {
      const def = key === 'tagName' ? 'div' : '';
      const inst = attributes[key] || def;
      const master = masterAttributes[key] || def;
      if (inst === def && master === def) continue; // both default
      maxLevel = Math.max(maxLevel, inst === master ? 2 : 3);
    }
    // Arrays: compare as JSON
    for (const key of ['customAttributes', 'extraAriaAttributes']) {
      const inst = JSON.stringify(attributes[key] || []);
      const master = JSON.stringify(masterAttributes[key] || []);
      if (inst === '[]' && master === '[]') continue;
      maxLevel = Math.max(maxLevel, inst === master ? 2 : 3);
    }
    return maxLevel;
  }, [masterAttributes, attributes]);
  const isWrapperTabModified = wrapperTabLevel > 0;

  const blockProps = useBlockProps({
    id:           anchorId  || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         role      || undefined,
  });

  const isDirectlySelected = useSelect((select) =>
    select(blockEditorStore).getSelectedBlockClientId() === clientId,
  [clientId]);

  const innerBlocksProps = useInnerBlocksProps(blockProps, {
    defaultBlock: { name: 'tmsblocks/paragraph' },
    directInsert: false,
    renderAppender: isDirectlySelected
      ? () => <ButtonBlockAppender className="tmsblocks-block-appender__button" rootClientId={clientId} />
      : false,
  });

  return (
    <>
      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-top-tabs"
            tabs={[
              { name: 'wrapper', title: <ControlLabel label="Wrapper" level={wrapperTabLevel} /> },
              { name: 'styles',  title: <ControlLabel label="Styles"  level={stylesTabLevel} /> },
            ]}
          >
            {(tab) => {

              // -- Wrapper tab ----------------------------------------------
              if (tab.name === 'wrapper') {
                return (
                  <div style={{ backgroundColor: 'var(--tms-cold-white)',  padding: '16px' }}>
                    <TagControls       attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                    <AriaControls      attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                    <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
                    <IdentityControls  attributes={attributes} setAttributes={setAttributes} masterAttributes={masterAttributes} />
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
                    isDesktopModified={isBaseModified}
                    desktopLevel={desktopLevel}
                    getBreakpointIsSet={(key) =>
                      Object.keys(responsiveStyle?.[key]?.base || {}).length > 0 ||
                      Object.keys(responsiveStyle?.[key]?.hover || {}).length > 0 ||
                      Object.keys(responsiveStyle?.[key]?.focusVisible || {}).length > 0
                    }
                    getBreakpointLevel={getBreakpointLevel}
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

      <TagName {...innerBlocksProps} />
    </>
  );
}
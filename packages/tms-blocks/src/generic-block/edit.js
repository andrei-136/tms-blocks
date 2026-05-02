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
import { customStyleToCSSString, hasModifiedStyleProps } from '../../../shared/src/style-utils';
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

  const isBaseModified         = hasModifiedStyleProps(base.style,  Object.keys(base.style  || {}));
  const isHoverModified        = hasModifiedStyleProps(hover.style, Object.keys(hover.style || {}));
  const isFocusModified        = hasModifiedStyleProps(focus.style, Object.keys(focus.style || {}));

  const tabs = [
    { name: 'base',          title: <ControlLabel label="Base"          isSet={isBaseModified}  /> },
    { name: 'hover',         title: <ControlLabel label="Hover"         isSet={isHoverModified} /> },
    { name: 'focus-visible', title: <ControlLabel label="Focus-Visible" isSet={isFocusModified} /> },
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

export default function Edit({ attributes, setAttributes, clientId }) {
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
  const isBaseModified       = hasModifiedStyleProps(customStyle,             baseKeys);
  const isStyleTabModified   = isBaseModified || isResponsiveModified;

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
              { name: 'wrapper', title: 'Wrapper' },
              { name: 'styles',  title: <ControlLabel label="Styles"  isSet={isStyleTabModified}        /> },
            ]}
          >
            {(tab) => {

              // -- Wrapper tab ----------------------------------------------
              if (tab.name === 'wrapper') {
                return (
                  <div style={{ backgroundColor: 'var(--tms-cold-white)',  padding: '16px' }}>
                    <TagControls       attributes={attributes} setAttributes={setAttributes} />
                    <AriaControls      attributes={attributes} setAttributes={setAttributes} />
                    <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} />
                    <IdentityControls  attributes={attributes} setAttributes={setAttributes} />
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
                    getBreakpointIsSet={(key) =>
                      Object.keys(responsiveStyle?.[key]?.base || {}).length > 0 ||
                      Object.keys(responsiveStyle?.[key]?.hover || {}).length > 0 ||
                      Object.keys(responsiveStyle?.[key]?.focusVisible || {}).length > 0
                    }
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
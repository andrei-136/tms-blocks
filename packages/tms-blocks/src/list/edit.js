import React, { useMemo, useState } from 'react';
import {
  useBlockProps,
  useInnerBlocksProps,
  InspectorControls,
  useStyleOverride,
  ButtonBlockAppender,
  store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button, TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { customStyleToCSSString, customStyleToInlineStyle, hasModifiedStyleProps } from '../../../shared/src/style-utils';
import { useCustomStyle, useUniqueId, useBreakpointStyles } from '../../../shared/src/hooks';
import {
  StyleControls,
  IdentityControls,
  AriaControls,
  BreakpointSelector,
  CustomAttributesControls,
  ControlLabel,
  PanelTitle,
  ListSettings,
} from '../../../shared/src/controls';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

// -- Constants ----------------------------------------------------------------

const LIST_ROLE_OPTIONS = [
  { label: 'None',          value: ''             },
  { label: 'directory',     value: 'directory'    },
  { label: 'group',         value: 'group'        },
  { label: 'listbox',       value: 'listbox'      },
  { label: 'menu',          value: 'menu'         },
  { label: 'menubar',       value: 'menubar'      },
  { label: 'radiogroup',    value: 'radiogroup'   },
  { label: 'tablist',       value: 'tablist'      },
  { label: 'toolbar',       value: 'toolbar'      },
  { label: 'tree',          value: 'tree'         },
  { label: 'presentation',  value: 'presentation' },
];

// -- Main Edit ----------------------------------------------------------------

export default function Edit({ attributes, setAttributes, clientId, masterAttributes }) {
  const {
    uniqueId,
    tagName             = 'ul',
    anchorId,
    ariaLabel,
    ariaRole,
    customAttributes    = [],
    customStyle         = {},
    customStyleHover    = {},
    customStyleFocusVisible = {},
    responsiveStyle     = {},
    breakpointOverrides = {},
    customBreakpoints   = [],
    tmsClassName        = '',
    renderBlock         = true,
  } = attributes;

  useUniqueId({ uniqueId, clientId, setAttributes });

  const uniqueClassName = uniqueId ? `tmsblocks-list-${uniqueId}` : '';

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
    id: `tmsblocks-list-${clientId}`,
    css: uniqueClassName
      ? [
          cssString             ? `.editor-styles-wrapper .${uniqueClassName} { ${cssString} }`                           : '',
          cssStringHover        ? `.editor-styles-wrapper .${uniqueClassName}:hover { ${cssStringHover} }`                : '',
          cssStringFocusVisible ? `.editor-styles-wrapper .${uniqueClassName}:focus-visible { ${cssStringFocusVisible} }` : '',
          cssStringResponsive,
        ].filter(Boolean).join('\n')
      : ''
  });

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle             = useCustomStyle(customStyle,             setAttributes, 'customStyle');
  const updateCustomStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateCustomStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const { getUpdater, getStyle }      = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Breakpoint tabs --------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

  const allBreakpoints = useMemo(() =>
    resolveBreakpoints(breakpointOverrides, Object.keys(responsiveStyle || {}), customBreakpoints),
    [breakpointOverrides, responsiveStyle, customBreakpoints]
  );

  // -- Modified indicators ----------------------------------------------------

  const baseKeys           = useMemo(() => Object.keys(customStyle || {}), [customStyle]);
  const isBaseModified     = hasModifiedStyleProps(customStyle, baseKeys);
  const isResponsiveModified = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );
  const isStyleTabModified   = isBaseModified || isResponsiveModified;


  // -- Block props ------------------------------------------------------------

  const TagName           = tagName || 'ul';
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole || undefined,
    style:        customStyleToInlineStyle(customStyle),
  });

  const isDirectlySelected = useSelect((select) =>
    select(blockEditorStore).getSelectedBlockClientId() === clientId,
  [clientId]);

  const innerBlocksProps = useInnerBlocksProps(blockProps, {
    allowedBlocks: ['tmsblocks/list-item', 'tmsblocks/generic-block'],
    template: [['tmsblocks/list-item']],
    templateLock: false,
    renderAppender: isDirectlySelected
      ? () => <ButtonBlockAppender className="tmsblocks-block-appender__button" rootClientId={clientId} />
      : false,
    defaultBlock: { name: 'tmsblocks/list-item' },
    directInsert: true,
  });

  // -- Active style context ---------------------------------------------------

  const getActiveContext = (state) => {
    if (activeBreakpoint === 'desktop') {
      const map = {
        base:         { style: customStyle,             updater: updateCustomStyle },
        hover:        { style: customStyleHover,        updater: updateCustomStyleHover },
        focusVisible: { style: customStyleFocusVisible, updater: updateCustomStyleFocusVisible },
      };
      return map[state] || map.base;
    }
    return {
      style:   getStyle(activeBreakpoint, state),
      updater: getUpdater(activeBreakpoint, state),
    };
  };

  return (
    <>
      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-list-top-tabs tmsblocks-inspector-top-tabs"
            tabs={[
              { name: 'wrapper', title: 'Wrapper' },
              { name: 'styles',  title: <ControlLabel label="Styles"  isSet={isStyleTabModified} /> },
            ]}
          >
            {(tab) => {

              // -- Wrapper tab ------------------------------------------------
              if (tab.name === 'wrapper') {
                return (
                  <div style={{ backgroundColor: 'var(--tms-cold-white)', padding: '16px' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' }}>
                      <ListSettings
                        attributes={attributes}
                        setAttributes={setAttributes}
                        customStyle={customStyle}
                        updateCustomStyle={updateCustomStyle}
                      />
                    </div>
                      <AriaControls
                        attributes={attributes}
                        setAttributes={setAttributes}
                        roleOptions={LIST_ROLE_OPTIONS}
                      />
                      <CustomAttributesControls
                        attributes={attributes}
                        setAttributes={setAttributes}
                      />
                      <IdentityControls
                        attributes={attributes}
                        setAttributes={setAttributes}
                        showRenderToggle={false}
                      />
                  </div>
                );
              }

              // -- Styles tab -----------------------------------------------
              return (
                <>
                  {/* Breakpoint selector */}
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

                  {/* State tabs */}
                  <TabPanel
                    className="tmsblocks-state-tabs"
                    tabs={[
                      { name: 'base',          title: <ControlLabel label="Base"          isSet={hasModifiedStyleProps(getActiveContext('base').style,         Object.keys(getActiveContext('base').style         || {}))} /> },
                      { name: 'hover',         title: <ControlLabel label="Hover"         isSet={hasModifiedStyleProps(getActiveContext('hover').style,        Object.keys(getActiveContext('hover').style        || {}))} /> },
                      { name: 'focus-visible', title: <ControlLabel label="Focus-Visible" isSet={hasModifiedStyleProps(getActiveContext('focusVisible').style, Object.keys(getActiveContext('focusVisible').style || {}))} /> },
                    ]}
                  >
                    {(stateTab) => {
                      const stateKey = stateTab.name === 'focus-visible' ? 'focusVisible' : stateTab.name;
                      const { style, updater } = getActiveContext(stateKey);
                      return (
                        <StyleControls
                          updateCustomStyle={updater}
                          attributes={{ ...attributes, customStyle: style }}
                          setAttributes={(patch) => {
                            if (patch.customStyle !== undefined) updater(patch.customStyle);
                            else setAttributes(patch);
                          }}
                          clientId={clientId}
                          include={['List']}
                          exclude={['Transition']}
                          controlProps={stateTab.name !== 'base' ? { Display: { useUtilityClasses: false } } : {}}
                          masterAttributes={masterAttributes}
                        />
                      );
                    }}
                  </TabPanel>
                </>
              );
            }}
          </TabPanel>
        </div>
      </InspectorControls>

      {renderBlock && React.createElement(TagName, innerBlocksProps)}
    </>
  );
}
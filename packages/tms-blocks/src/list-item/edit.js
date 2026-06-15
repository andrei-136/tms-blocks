import React, { useMemo, useState } from 'react';
import {
  useBlockProps,
  useInnerBlocksProps,
  RichText,
  ButtonBlockAppender,
  InspectorControls,
  useStyleOverride,
  store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { Button, TabPanel } from '@wordpress/components';
import { customStyleToInlineStyle, customStyleToCSSString, hasModifiedStyleProps } from '../../../shared/src/style-utils';
import { useCustomStyle, useUniqueId, useBreakpointStyles } from '../../../shared/src/hooks';
import {
  ListItemSettings,
  StyleControls,
  IdentityControls,
  AriaControls,
  BreakpointSelector,
  CustomAttributesControls,
  ControlLabel,
  PanelTitle,
} from '../../../shared/src/controls';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

// -- Constants ----------------------------------------------------------------

const LIST_ITEM_ROLE_OPTIONS = [
  { label: 'None',              value: ''                 },
  { label: 'menuitem',          value: 'menuitem'         },
  { label: 'menuitemcheckbox',  value: 'menuitemcheckbox' },
  { label: 'menuitemradio',     value: 'menuitemradio'    },
  { label: 'option',            value: 'option'           },
  { label: 'radio',             value: 'radio'            },
  { label: 'separator',         value: 'separator'        },
  { label: 'tab',               value: 'tab'              },
  { label: 'treeitem',          value: 'treeitem'         },
  { label: 'presentation',      value: 'presentation'     },
];

// -- Shared style hook --------------------------------------------------------

function useListItemStyle({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints }) {
  const uniqueClassName = uniqueId ? `tmsblocks-list-item-${uniqueId}` : '';

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
    id: `tmsblocks-list-item-${clientId}`,
    css: uniqueClassName
      ? [
          cssString             ? `.editor-styles-wrapper .${uniqueClassName} { ${cssString} }`                           : '',
          cssStringHover        ? `.editor-styles-wrapper .${uniqueClassName}:hover { ${cssStringHover} }`                : '',
          cssStringFocusVisible ? `.editor-styles-wrapper .${uniqueClassName}:focus-visible { ${cssStringFocusVisible} }` : '',
          cssStringResponsive,
        ].filter(Boolean).join('\n')
      : ''
  });

  return uniqueClassName;
}

// -- EditCanvas ---------------------------------------------------------------

function EditCanvas({ attributes, setAttributes, clientId }) {
  const {
    content             = '',
    uniqueId,
    anchorId,
    ariaLabel,
    ariaRole,
    customStyle         = {},
    customStyleHover    = {},
    customStyleFocusVisible = {},
    responsiveStyle     = {},
    breakpointOverrides = {},
    customBreakpoints   = [],
    tmsClassName        = '',
    renderBlock         = true,
  } = attributes;

  const uniqueClassName   = useListItemStyle({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();

  const hasInnerBlocks = useSelect((select) =>
    (select(blockEditorStore).getBlock(clientId)?.innerBlocks?.length ?? 0) > 0,
  [clientId]);

  const shouldRenderRichText = !!content?.trim() || !hasInnerBlocks;

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole || undefined,
    style:        customStyleToInlineStyle(customStyle),
  });

  const innerBlocksProps = useInnerBlocksProps({}, {
    renderAppender: false,
    defaultBlock:   { name: 'tmsblocks/paragraph' },
    directInsert:   false,
  });

  if (!renderBlock) return null;

  return (
    <li {...blockProps}>
      {shouldRenderRichText && (
        <RichText
          allowedFormats={['core/bold', 'core/italic', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
          tagName="span"
          value={content}
          onChange={(value) => setAttributes({ content: value })}
          placeholder="..."
        />
      )}
      {hasInnerBlocks && <div {...innerBlocksProps} />}
    </li>
  );
}

// -- EditSelected -------------------------------------------------------------

function EditSelected({ attributes, setAttributes, clientId, masterAttributes }) {
  const {
    content              = '',
    uniqueId,
    anchorId,
    ariaLabel,
    ariaRole,
    customAttributes     = [],
    customStyle          = {},
    customStyleHover     = {},
    customStyleFocusVisible = {},
    responsiveStyle      = {},
    breakpointOverrides  = {},
    customBreakpoints    = [],
    tmsClassName         = '',
    renderBlock          = true,
  } = attributes;

  // -- Style updaters ---------------------------------------------------------

  const updateCustomStyle             = useCustomStyle(customStyle,             setAttributes, 'customStyle');
  const updateCustomStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateCustomStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const { getUpdater, getStyle }      = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Canvas styles ----------------------------------------------------------

  const uniqueClassName   = useListItemStyle({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, uniqueClassName].filter(Boolean).join(' ').trim();

  // -- Breakpoint tabs --------------------------------------------------------

  const [activeBreakpoint, setActiveBreakpoint] = useState('desktop');

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
  const isStyleTabModified = isBaseModified || isResponsiveModified;


  // -- Block props ------------------------------------------------------------

  const isDirectlySelected = useSelect((select) =>
    select(blockEditorStore).getSelectedBlockClientId() === clientId,
  [clientId]);

  const isSelectedOrChild = useSelect((select) => {
    const store      = select(blockEditorStore);
    const selectedId = store.getSelectedBlockClientId();
    if (!selectedId) return false;
    return selectedId === clientId || store.getBlockParents(selectedId).includes(clientId);
  }, [clientId]);

  const hasInnerBlocks = useSelect((select) =>
    (select(blockEditorStore).getBlock(clientId)?.innerBlocks?.length ?? 0) > 0,
  [clientId]);

  const shouldRenderRichText = isSelectedOrChild || !!content?.trim() || !hasInnerBlocks;

  const blockProps = useBlockProps({
    id:           anchorId || undefined,
    className:    combinedClassName || undefined,
    'aria-label': ariaLabel || undefined,
    role:         ariaRole || undefined,
    style:        customStyleToInlineStyle(customStyle),
  });

  const innerBlocksProps = useInnerBlocksProps({}, {
    renderAppender: isDirectlySelected
      ? () => <ButtonBlockAppender className="tmsblocks-block-appender__button" rootClientId={clientId} />
      : false,
    defaultBlock: { name: 'tmsblocks/paragraph' },
    directInsert: false,
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
            className="tmsblocks-list-item-top-tabs tmsblocks-inspector-top-tabs"
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
                      <ListItemSettings
                        attributes={attributes}
                        setAttributes={setAttributes}
                        customStyle={customStyle}
                        updateCustomStyle={updateCustomStyle}
                      />
                    </div>
                      <AriaControls
                        attributes={attributes}
                        setAttributes={setAttributes}
                        roleOptions={LIST_ITEM_ROLE_OPTIONS}
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

              // -- Styles tab -------------------------------------------------
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
                      const stateKey      = stateTab.name === 'focus-visible' ? 'focusVisible' : stateTab.name;
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

      {renderBlock && (
        <li {...blockProps}>
          <RichText
            allowedFormats={['core/bold', 'core/italic', 'core/strikethrough', 'core/code', 'core/subscript', 'core/superscript', 'core/text-color']}
            tagName="span"
            value={content}
            onChange={(value) => setAttributes({ content: value })}
            placeholder="..."
          />
          {(hasInnerBlocks || isSelectedOrChild) && (
            <div {...innerBlocksProps} />
          )}
        </li>
      )}
    </>
  );
}

// -- Entry point --------------------------------------------------------------

export default function Edit(props) {
  const { clientId, attributes, setAttributes } = props;
  const { uniqueId } = attributes;

  useUniqueId({ uniqueId, clientId, setAttributes });

  const isSelected = useSelect((select) => {
    const store      = select(blockEditorStore);
    const selectedId = store.getSelectedBlockClientId();
    if (!selectedId) return false;
    const parents = store.getBlockParents(selectedId) || [];
    return selectedId === clientId || parents.includes(clientId);
  }, [clientId]);

  if (isSelected) return <EditSelected {...props} />;
  return <EditCanvas {...props} />;
}
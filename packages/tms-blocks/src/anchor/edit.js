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
  AriaControls, BreakpointSelector, CustomAttributesControls, ControlLabel,
  TransitionControls, TRANSITION_DEFAULT_GLOBAL,
} from '../../../shared/src/controls';
import AnchorSettings from '../../../shared/src/controls/AnchorSettings';
import { useCustomStyle, useUniqueId, useBreakpointStyles, useDynamicField } from '../../../shared/src/hooks';
import { customStyleToCSSString, hasModifiedStyleProps } from '../../../shared/src/style-utils';
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

const ANCHOR_STYLE_EXCLUDE = ['BackgroundImage', 'Image', 'List', 'ListItem', 'Wrapper', 'Anchor', 'ClassName', 'Transition'];

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

  const tabs = [
    { name: 'base',          title: <ControlLabel label="Base"          isSet={isBaseModified}  /> },
    { name: 'hover',         title: <ControlLabel label="Hover"         isSet={isHoverModified} /> },
    { name: 'focus-visible', title: <ControlLabel label="Focus-Visible" isSet={isFocusModified} /> },
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
                exclude={ANCHOR_STYLE_EXCLUDE}
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
                  if (patch.customStyle !== undefined) focus.updater(patch.customStyle);
                  else setAttributes(patch);
                }}
                clientId={clientId}
                exclude={ANCHOR_STYLE_EXCLUDE}
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
              if (patch.customStyle !== undefined) base.updater(patch.customStyle);
              else setAttributes(patch);
            }}
            clientId={clientId}
            exclude={ANCHOR_STYLE_EXCLUDE}
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
    <div {...blockProps}>
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
          />
        )
      )}
      <div {...innerBlocksProps} />
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

  const isStyleTabModified = isBaseModified || isResponsiveModified || hasTransitionPanelChanges;

  // -- Canvas styles ----------------------------------------------------------

  const uniqueClassName   = useAnchorStyles({ uniqueId, clientId, customStyle, customStyleHover, customStyleFocusVisible, responsiveStyle, breakpointOverrides, customBreakpoints });
  const combinedClassName = [tmsClassName, utilityClasses, className, uniqueClassName].filter(Boolean).join(' ').trim();

  const blockProps = useBlockProps({ id: anchorId || undefined, className: combinedClassName || undefined });

  const isDirectlySelected = useSelect((select) =>
    select(blockEditorStore).getSelectedBlockClientId() === clientId,
  [clientId]);

  const innerBlocksProps = useInnerBlocksProps({}, {
    renderAppender: isDirectlySelected
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
              { name: 'wrapper', title: 'Wrapper' },
              { name: 'styles',  title: <ControlLabel label="Styles"  isSet={isStyleTabModified} /> },
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
                      />
                    </div>
                      <AriaControls attributes={attributes} setAttributes={setAttributes} roleOptions={ANCHOR_ROLE_OPTIONS} />
                      <CustomAttributesControls attributes={attributes} setAttributes={setAttributes} />
                      <IdentityControls attributes={attributes} setAttributes={setAttributes} />
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

      {hasAnchorBlockInParents && (
        <Notice status="error" isDismissible={false}>
          ?? This anchor block is nested inside another anchor block. Nesting anchor blocks is not allowed.
        </Notice>
      )}

      <div {...blockProps}>
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
            />
          )
        )}
        <div {...innerBlocksProps} />
      </div>
    </>
  );
}

// -- Entry point --------------------------------------------------------------

export default function Edit(props) {
  const { clientId, attributes, setAttributes, context } = props;
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
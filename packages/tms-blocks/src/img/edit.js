import React, { useEffect, useMemo, useState } from 'react';
import {
  InspectorControls,
  useBlockProps,
  useStyleOverride,
} from '@wordpress/block-editor';
import { Button, TabPanel } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
  customStyleToInlineStyle,
  customStyleToCSSString,
  hasModifiedStyleProps,
} from '../../../shared/src/style-utils';
import apiFetch from '@wordpress/api-fetch';
import useCustomStyle from '../../../shared/src/hooks/useCustomStyle';
import useDynamicField from '../../../shared/src/hooks/useDynamicField';
import useUniqueId from '../../../shared/src/hooks/useUniqueId';
import useBreakpointStyles from '../../../shared/src/hooks/useBreakpointStyles';
import StyleControls from '../../../shared/src/controls/StyleControls';
import BreakpointSelector from '../../../shared/src/controls/BreakpointSelector';
import IdentityControls from '../../../shared/src/controls/IdentityControls';
import AriaControls from '../../../shared/src/controls/AriaControls';
import CustomAttributesControls from '../../../shared/src/controls/CustomAttributesControls';

import TransitionControls, { DEFAULT_GLOBAL as DEFAULT_TRANSITION_GLOBAL } from '../../../shared/src/controls/TransitionControls';
import ControlLabel from '../../../shared/src/controls/ControlLabel';
import ImgSettings from './ImgSettings';
import { resolveBreakpoints } from '../../../shared/src/breakpoints';

// -- Helpers ------------------------------------------------------------------

const isImageUrl = (v) => {
  if (typeof v !== 'string') return false;
  const trimmed = v.trim();
  return (
    /^https?:\/\//i.test(trimmed) ||
    /^\/\//.test(trimmed)         ||
    /^\/(?!\/)/.test(trimmed)     ||
    /^blob:/i.test(trimmed)        ||
    /^data:image\//i.test(trimmed)
  );
};

const getMediaRecord = (selectFn, id) => {
  const numericId = Number(id);
  if (!numericId) return null;

  const coreStore = selectFn('core');
  return coreStore.getMedia?.(numericId) || coreStore.getEntityRecord('postType', 'attachment', numericId) || null;
};

const getSelectedMediaUrl = (media, preferredSize = 'full') => {
  if (!media) return '';

  return (
    media?.sizes?.[preferredSize]?.url ||
    media?.media_details?.sizes?.[preferredSize]?.source_url ||
    media?.sizes?.full?.url ||
    media?.media_details?.sizes?.full?.source_url ||
    media?.url ||
    media?.source_url ||
    ''
  );
};

// -- Breakpoint state tabs ----------------------------------------------------

function BreakpointStateTabs({
  customStyle,
  customStyleHover,
  customStyleFocusVisible,
  updateStyle,
  updateStyleHover,
  updateStyleFocusVisible,
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
    updater: isDesktop ? updateStyle             : getUpdater(activeBreakpoint, 'base'),
  };
  const hover = {
    style:   isDesktop ? customStyleHover        : getStyle(activeBreakpoint, 'hover'),
    updater: isDesktop ? updateStyleHover        : getUpdater(activeBreakpoint, 'hover'),
  };
  const focus = {
    style:   isDesktop ? customStyleFocusVisible       : getStyle(activeBreakpoint, 'focusVisible'),
    updater: isDesktop ? updateStyleFocusVisible : getUpdater(activeBreakpoint, 'focusVisible'),
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
                  updateCustomStyle={updateStyle}
                  stateStyles={{ hover: customStyleHover, focusVisible: customStyleFocusVisible }}
                  transitionConfig={transitionConfig}
                  setTransitionConfig={setTransitionConfig}
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
                include = {['Object']}
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
                  updateCustomStyle={updateStyle}
                  stateStyles={{ hover: customStyleHover, focusVisible: customStyleFocusVisible }}
                  transitionConfig={transitionConfig}
                  setTransitionConfig={setTransitionConfig}
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
                controlProps={{ Display: { useUtilityClasses: false } }}
                include={['Object']}
              />
            </>
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
            include={['Object']}
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

export default function Edit({ attributes, setAttributes, clientId, context }) {
  const {
    uniqueId,
    imageSource      = 'library',
    imageID          = null,
    imageURL         = '',
    imagePath        = '',
    imageSteps       = [{ type: '', value: '' }],
    imageSize        = 'full',
    alt              = '',
    altSource: rawAltSource = 'media-library',
    altPath          = '',
    altSteps         = [{ type: '', value: '' }],
    loading          = 'lazy',
    decoding         = 'auto',
    fetchpriority    = '',
    customStyle      = {},
    customStyleHover = {},
    customStyleFocusVisible = {},
    responsiveStyle      = {},
    breakpointOverrides  = {},
    customBreakpoints    = [],
    transitionConfig = {},
    renderBlock      = true,
    tmsClassName     = '',
    anchorId         = '',
    sourcePostId     = 0,
    sourcePostType   = '',
    postSource       = 'current',
  } = attributes;

  // -- Context ----------------------------------------------------------------

  const contextPostId   = context?.['tmsblocks/contextPostId'] || context?.['tms/contextPostId'] || context?.postId || 0;
  const contextPostType = context?.['tmsblocks/contextPostType'] || context?.['tms/contextPostType'] || context?.postType || 'post';
  const hasContext      = contextPostId > 0;

  const editorPostId   = useSelect((s) => s('core/editor')?.getCurrentPostId?.()   || 0,      []);
  const editorPostType = useSelect((s) => s('core/editor')?.getCurrentPostType?.() || 'post', []);

  const effectivePostId   = postSource === 'specific' ? sourcePostId   : (contextPostId   || editorPostId);
  const effectivePostType = postSource === 'specific' ? (sourcePostType || 'post') : (contextPostType || editorPostType);

  useUniqueId({ uniqueId, clientId, setAttributes });

  // -- Style updaters ---------------------------------------------------------

  const updateStyle             = useCustomStyle(customStyle,             setAttributes);
  const updateStyleHover        = useCustomStyle(customStyleHover,        setAttributes, 'customStyleHover');
  const updateStyleFocusVisible = useCustomStyle(customStyleFocusVisible, setAttributes, 'customStyleFocusVisible');
  const setTransitionConfig     = (v) => setAttributes({ transitionConfig: v });
  const { getUpdater, getStyle } = useBreakpointStyles(responsiveStyle, setAttributes);

  // -- Editor CSS -------------------------------------------------------------

  const uniqueClass = uniqueId ? `tmsblocks-img-${uniqueId}` : '';

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
    id: `tmsblocks-img-${clientId}`,
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
    Object.entries(DEFAULT_TRANSITION_GLOBAL).some(([k, def]) => transitionGlobal[k] !== undefined && transitionGlobal[k] !== def) ||
    Object.keys(transitionConfig?.overrides || {}).length > 0 ||
    Object.values(transitionConfig?.states  || {}).some((s) => s?.linked === false || (s?.unlinkedProperties || []).length > 0);

  const isBaseModified         = hasModifiedStyleProps(customStyle,             Object.keys(customStyle             || {})) || hasTransitionChanges;
  const isHoverModified        = hasModifiedStyleProps(customStyleHover,        Object.keys(customStyleHover        || {}));
  const isFocusVisibleModified = hasModifiedStyleProps(customStyleFocusVisible, Object.keys(customStyleFocusVisible || {}));

  const isResponsiveModified = Object.keys(responsiveStyle || {}).some((key) =>
    Object.keys(responsiveStyle[key]?.base         || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.hover        || {}).length > 0 ||
    Object.keys(responsiveStyle[key]?.focusVisible || {}).length > 0
  );
  const isStyleTabModified = isBaseModified || isHoverModified || isFocusVisibleModified || isResponsiveModified;

  // -- Derived alt source -----------------------------------------------------

  const isLibraryLikeSource = imageSource === 'library' || imageSource === 'context';
  const effectiveAltSource  = isLibraryLikeSource
    ? (rawAltSource === 'manual-library' ? 'manual-library' : rawAltSource === 'dynamic' ? 'dynamic' : 'media-library')
    : (rawAltSource === 'dynamic' ? 'dynamic' : 'manual');

  // -- Data: images -----------------------------------------------------------

  const image = useSelect(
    (s) => (imageSource === 'library' && imageID) ? getMediaRecord(s, imageID) : null,
    [imageSource, imageID]
  );
  const contextPost = useSelect(
    (s) => (imageSource === 'context' && hasContext)
      ? (contextPostType === 'attachment' ? getMediaRecord(s, contextPostId) : s('core').getEntityRecord('postType', contextPostType, contextPostId))
      : null,
    [imageSource, hasContext, contextPostId, contextPostType]
  );
  const contextFeaturedId    = contextPost?.featured_media || 0;
  const contextFeaturedImage = useSelect(
    (s) => contextFeaturedId ? getMediaRecord(s, contextFeaturedId) : null,
    [contextFeaturedId]
  );
  const contextImage = contextPostType === 'attachment' ? contextPost : contextFeaturedImage;

  const editorImageSizes = useSelect((s) => s('core/editor').getEditorSettings().imageSizes || [], []);
  const taxonomies = useSelect((s) => s('core').getTaxonomies({ per_page: -1 }) || [], []);
  const taxonomyOptions = useMemo(() =>
    [{ label: 'Select taxonomy', value: '' }].concat(
      taxonomies.map((t) => ({ label: t.name || t.slug, value: t.slug }))
    ), [taxonomies]);

  // -- Dynamic data -----------------------------------------------------------

  const needsDynamic      = imageSource === 'dynamic' || effectiveAltSource === 'dynamic';
  const mergedDynamicPath = useMemo(() => {
    if (!needsDynamic) return '';
    return [imagePath, altPath].filter(Boolean).join('.');
  }, [needsDynamic, imagePath, altPath]);

  const { postMetaOptions, termMetaOptionsByTax, userMetaOptions } = useDynamicField({
    path: mergedDynamicPath, postId: effectivePostId, postType: effectivePostType,
    dateFormat: '', commentsNoText: '', commentsOneText: '', commentsManyText: '',
  });
  const { previewValue: dynamicSrc } = useDynamicField({
    path: imageSource === 'dynamic' ? imagePath : '',
    postId: effectivePostId, postType: effectivePostType,
    dateFormat: '', commentsNoText: '', commentsOneText: '', commentsManyText: '',
  });
  const { previewValue: dynamicAlt } = useDynamicField({
    path: effectiveAltSource === 'dynamic' ? altPath : '',
    postId: effectivePostId, postType: effectivePostType,
    dateFormat: '', commentsNoText: '', commentsOneText: '', commentsManyText: '',
  });

  const [localUrl,      setLocalUrl]      = useState(imageURL);
  const [localAlt,      setLocalAlt]      = useState(alt);
  const [previewBroken, setPreviewBroken] = useState(false);

  useEffect(() => { setLocalUrl(imageURL); }, [imageURL]);
  useEffect(() => {
    if (effectiveAltSource === 'dynamic') { setLocalAlt(dynamicAlt || ''); return; }
    if (isLibraryLikeSource && effectiveAltSource === 'media-library') {
      const src = imageSource === 'context' ? contextImage : image;
      setLocalAlt(src?.alt_text || ''); return;
    }
    setLocalAlt(alt || '');
  }, [effectiveAltSource, isLibraryLikeSource, imageSource, image?.alt_text, contextImage?.alt_text, alt, dynamicAlt]);
  useEffect(() => { setPreviewBroken(false); }, [imageSource, imageID, imageURL, dynamicSrc]);

  // -- Alt save handlers ------------------------------------------------------

  const getCurrentAttachmentId = () => {
    if (!isLibraryLikeSource) return 0;

    return imageSource === 'context'
      ? Number(contextPostType === 'attachment' ? contextPostId : contextFeaturedId)
      : Number(imageID || 0);
  };

  const handleAltChange = (val) => {
    setLocalAlt(val);
    if (!isLibraryLikeSource || effectiveAltSource === 'manual-library') setAttributes({ alt: val });
  };

  const handleAltBlur = async () => {
    if (!isLibraryLikeSource || effectiveAltSource === 'manual-library') {
      setAttributes({ alt: (localAlt || '').trim() });
    }
  };

  const handleMediaLibraryClose = async () => {
    if (!isLibraryLikeSource || effectiveAltSource !== 'media-library') return;

    const attachmentId = getCurrentAttachmentId();
    if (!attachmentId) return;

    try {
      const media = await apiFetch({ path: `/wp/v2/media/${attachmentId}` });
      const nextAlt = String(media?.alt_text || '').trim();
      setLocalAlt(nextAlt);
    } catch {
      // Leave the current local value unchanged if the refresh fails.
    }
  };

  // -- Source handlers --------------------------------------------------------

  const handleSelect = (media) => {
    const nextUrl = getSelectedMediaUrl(media, imageSize);
    const nextAlt = String(media?.alt || media?.alt_text || '').trim();

    setLocalUrl(nextUrl);

    if (effectiveAltSource === 'media-library') {
      setLocalAlt(nextAlt);
    }

    setAttributes({
      imageID: media?.id || null,
      imageURL: nextUrl,
    });
  };
  const handleInsertFromUrl  = ()      => setAttributes({ imageID: null, imageURL: (localUrl || '').trim() });
  const handleClearCurrentSource = () => {
    if (imageSource === 'library') { setAttributes({ imageID: null }); return; }
    if (imageSource === 'url')     { setLocalUrl(''); setAttributes({ imageURL: '' }); return; }
    if (imageSource === 'dynamic') { setAttributes({ imagePath: '', imageSteps: [{ type: '', value: '' }] }); return; }
  };

  // -- Resolved preview -------------------------------------------------------

  const dynamicSrcIsId    = /^\d+$/.test(String(dynamicSrc).trim());
  const dynamicAttachment = useSelect(
    (s) => (imageSource === 'dynamic' && dynamicSrcIsId) ? getMediaRecord(s, Number(dynamicSrc)) : null,
    [imageSource, dynamicSrcIsId, dynamicSrc]
  );

  const isFeaturedImageUrlPath   = imageSource === 'dynamic' && String(imagePath || '').trim() === 'post:featured_image_url';
  const isAttachmentUrlPath      = imageSource === 'dynamic' && String(imagePath || '').trim() === 'post:attachment_url';
  const dynamicSourcePost        = useSelect(
    (s) => (isFeaturedImageUrlPath && effectivePostId > 0) ? s('core').getEntityRecord('postType', effectivePostType, effectivePostId) : null,
    [isFeaturedImageUrlPath, effectivePostId, effectivePostType]
  );
  const dynamicContextAttachment = useSelect(
    (s) => (isAttachmentUrlPath && effectivePostId > 0 && effectivePostType === 'attachment') ? getMediaRecord(s, effectivePostId) : null,
    [isAttachmentUrlPath, effectivePostId, effectivePostType]
  );
  const dynamicFeaturedAttachmentId = isFeaturedImageUrlPath ? Number(dynamicSourcePost?.featured_media || 0) : 0;
  const dynamicFeaturedAttachment   = useSelect(
    (s) => (dynamicFeaturedAttachmentId > 0) ? getMediaRecord(s, dynamicFeaturedAttachmentId) : null,
    [dynamicFeaturedAttachmentId]
  );

  const imageSizeOptions = useMemo(() => {
    // Determine the attachment object based on image source
    let attachmentWithSizes = null;
    
    if (imageSource === 'library') {
      attachmentWithSizes = image;
    } else if (imageSource === 'dynamic') {
      attachmentWithSizes = dynamicAttachment || dynamicContextAttachment || dynamicFeaturedAttachment;
    } else if (imageSource === 'context') {
      attachmentWithSizes = contextImage;
    }

    // If we have attachment sizes, use them
    if (attachmentWithSizes?.media_details?.sizes) {
      const attachmentSizes = Object.entries(attachmentWithSizes.media_details.sizes).map(([slug, data]) => ({
        label: data?.name || slug,
        value: slug,
      }));
      return [{ label: 'Full', value: 'full' }, ...attachmentSizes];
    }

    // Fall back to editor image sizes
    return [
      { label: 'Full', value: 'full' },
      ...editorImageSizes.map((s) => ({ label: s.name, value: s.slug })),
    ];
  }, [imageSource, image, dynamicAttachment, dynamicContextAttachment, dynamicFeaturedAttachment, contextImage, editorImageSizes]);

  const resolvedSrc =
    imageSource === 'library' ? (image?.media_details?.sizes?.[imageSize]?.source_url || image?.source_url || imageURL || '') :
    imageSource === 'url'     ? imageURL :
    imageSource === 'context' ? (contextImage?.media_details?.sizes?.[imageSize]?.source_url || contextImage?.source_url || '') :
    ( dynamicAttachment?.media_details?.sizes?.[imageSize]?.source_url || dynamicAttachment?.source_url
      || dynamicContextAttachment?.media_details?.sizes?.[imageSize]?.source_url || dynamicContextAttachment?.source_url
      || dynamicFeaturedAttachment?.media_details?.sizes?.[imageSize]?.source_url || dynamicFeaturedAttachment?.source_url
      || (isImageUrl(dynamicSrc) ? dynamicSrc.trim() : '') );

  const activePreviewUrl =
    imageSource === 'library' ? (image?.media_details?.sizes?.thumbnail?.source_url || image?.source_url || imageURL || '') :
    imageSource === 'url'     ? (localUrl || imageURL || '').trim() :
    imageSource === 'context' ? (contextImage?.source_url || '') :
    ( dynamicAttachment?.source_url || dynamicContextAttachment?.source_url
      || dynamicFeaturedAttachment?.source_url || (isImageUrl(dynamicSrc) ? dynamicSrc.trim() : '') );

  const hasSourceValue =
    (imageSource === 'library' && imageID !== null && imageID !== undefined) ||
    (imageSource === 'url'     && String(imageURL || localUrl || '').trim() !== '') ||
    (imageSource === 'dynamic' && (String(imagePath || '').trim() !== '' || imageSteps.some((s) => s?.type || s?.value))) ||
    (imageSource === 'context' && (contextPostType === 'attachment' ? hasContext : !!contextFeaturedId));

  // -- Options ----------------------------------------------------------------

  const imageSourceOptions = [
    { label: 'Media Library', value: 'library' },
    { label: 'URL',           value: 'url'     },
    { label: 'Dynamic',       value: 'dynamic' },
    ...(hasContext ? [{ label: 'Post Context (Featured Image)', value: 'context' }] : []),
  ];
  const altSourceOptions = isLibraryLikeSource
    ? [
        { label: 'Media Library (Synced)', value: 'media-library'  },
        { label: 'Manual Override',        value: 'manual-library' },
        { label: 'Dynamic',                value: 'dynamic'        },
      ]
    : [
        { label: 'Manual',  value: 'manual'  },
        { label: 'Dynamic', value: 'dynamic' },
      ];


  // -- Block props ------------------------------------------------------------

  const combinedClass = [tmsClassName, uniqueClass].filter(Boolean).join(' ');
  const blockProps    = useBlockProps({
    style:     customStyleToInlineStyle(customStyle),
    className: combinedClass || undefined,
    id:        anchorId || undefined,
  });

  // -- Render -----------------------------------------------------------------

  return (
    <>
      <InspectorControls>
        <div className="tmsblocks-inspector-controls">
          <div style={{ borderBottom: '1px solid #eee', marginBottom: '8px' }} />

          {/* Top-level tabs: Wrapper | Styles */}
          <TabPanel
            className="tmsblocks-img-top-tabs tmsblocks-inspector-top-tabs"
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
                    <ImgSettings
                      attributes={attributes}
                      hasContext={hasContext}
                      contextPostId={contextPostId}
                      imageSourceOptions={imageSourceOptions}
                      image={image}
                      imageSizeOptions={imageSizeOptions}
                      effectiveAltSource={effectiveAltSource}
                      altSourceOptions={altSourceOptions}
                      localAlt={localAlt}
                      localUrl={localUrl}
                      dynamicSrc={dynamicSrc}
                      dynamicAlt={dynamicAlt}
                      activePreviewUrl={activePreviewUrl}
                      previewBroken={previewBroken}
                      hasSourceValue={hasSourceValue}
                      taxonomyOptions={taxonomyOptions}
                      postMetaOptions={postMetaOptions}
                      termMetaOptionsByTax={termMetaOptionsByTax}
                      userMetaOptions={userMetaOptions}
                      onSetPreviewBroken={setPreviewBroken}
                      onSetAttributes={setAttributes}
                      onSelect={handleSelect}
                      onInsertFromUrl={handleInsertFromUrl}
                      onSetLocalUrl={setLocalUrl}
                      onClearCurrentSource={handleClearCurrentSource}
                      onAltChange={handleAltChange}
                      onAltBlur={handleAltBlur}
                      onMediaLibraryClose={handleMediaLibraryClose}
                    />


                    <AriaControls attributes={attributes} setAttributes={setAttributes} showRole={false} />

                    <CustomAttributesControls
                      attributes={attributes}
                      setAttributes={setAttributes}
                      extraAllowedKeys={['crossorigin']}
                      keywordValueMap={{
                        crossorigin: [
                          { label: 'anonymous', value: 'anonymous' },
                          { label: 'use-credentials', value: 'use-credentials' },
                        ],
                      }}
                    />
                    <IdentityControls attributes={attributes} setAttributes={setAttributes} />
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
                    isDesktopModified={isBaseModified || isHoverModified || isFocusVisibleModified}
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
                    updateStyle={updateStyle}
                    updateStyleHover={updateStyleHover}
                    updateStyleFocusVisible={updateStyleFocusVisible}
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

      {/* Canvas */}
      {resolvedSrc && !previewBroken ? (
        <img
          {...blockProps}
          src={resolvedSrc}
          alt={localAlt}
          onError={() => setPreviewBroken(true)}
        />
      ) : (
        <div
          {...blockProps}
          style={{
            ...blockProps.style,
            minHeight:       '80px',
            backgroundColor: '#e0e0e0',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '11px',
            color:           '#777',
            fontFamily:      'monospace',
          }}
        >
          {imageSource === 'context' && !hasContext ? 'No Post Context parent' : '<img>'}
        </div>
      )}
    </>
  );
}
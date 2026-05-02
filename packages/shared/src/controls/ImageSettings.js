import React, { useEffect, useMemo, useState } from 'react';
import {
  BaseControl,
  SelectControl,
  TextControl,
  Button,
  ToggleControl
} from '@wordpress/components';
import {
  MediaUpload,
  MediaUploadCheck
} from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import ControlLabel from './ControlLabel';
import DynamicFieldStepBuilder from './DynamicFieldStepBuilder';
import { isStylePropSet } from '../style-utils';

function DebugPathDisplay({ label, value }) {
  return (
    <BaseControl label={label}>
      <div
        style={{
          padding: '6px 10px',
          border: '1px solid #dcdcde',
          borderRadius: '2px',
          background: '#f6f7f7',
          color: '#50575e',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: 1.4,
          wordBreak: 'break-all',
          minHeight: '30px',
        }}
      >
        {value || 'Not set'}
      </div>
    </BaseControl>
  );
}

const stepsToPath = (steps) => {
  if (!Array.isArray(steps)) return '';
  return steps
    .map((step) => {
      if (!step || !step.type) return '';
      if (step.type === 'parent' || step.type === 'author' || step.type === 'comments') {
        return step.type;
      }
      if (step.value) return `${step.type}:${step.value}`;
      return '';
    })
    .filter(Boolean)
    .join('.');
};

export default function ImageSettings({ attributes, setAttributes }) {
  const {
    imageID,
    imageSource = 'library',
    imageURL = '',
    imagePath = '',
    imageSteps = [],
    linkType = 'none',
    linkUrl = '',
    linkTarget = '_self',
    alt = '',
    altSource: rawAltSource = 'manual',
    altPath = '',
    altSteps = [{ type: '', value: '' }],
    imageSize,
    loading = 'lazy',
    decoding = 'auto',
    fetchpriority = ''
  } = attributes;
  const { editEntityRecord, saveEditedEntityRecord } = useDispatch('core');
  const [localAlt, setLocalAlt] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState(imageURL || '');
  const [previewValue, setPreviewValue] = useState('');
  const [altPreviewValue, setAltPreviewValue] = useState('');
  const [isPreviewBroken, setIsPreviewBroken] = useState(false);

  const isLikelyImageUrl = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return /^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed);
  };

  const editorPostType = useSelect(
    (select) => select('core/editor')?.getCurrentPostType?.() || 'post',
    []
  );

  const editorPostId = useSelect(
    (select) => select('core/editor')?.getCurrentPostId?.() || 0,
    []
  );

  const { image } = useSelect((select) => {
    const store = select('core');
    const record = imageID
      ? store.getEntityRecord('postType', 'attachment', imageID)
      : null;
    return { image: record };
  }, [imageID]);

  const dynamicPreviewAttachmentId = useMemo(() => {
    if (imageSource !== 'dynamic') return 0;
    const candidate = String(previewValue || '').trim();
    return /^\d+$/.test(candidate) ? Number(candidate) : 0;
  }, [imageSource, previewValue]);

  const dynamicPreviewAttachment = useSelect((select) => {
    if (!dynamicPreviewAttachmentId) return null;
    return select('core').getEntityRecord('postType', 'attachment', dynamicPreviewAttachmentId);
  }, [dynamicPreviewAttachmentId]);

  const imageSizes = useSelect(
    (select) => select('core/editor').getEditorSettings().imageSizes || [],
    []
  );

  const taxonomies = useSelect(
    (select) => select('core').getTaxonomies({ per_page: -1 }) || [],
    []
  );

  const taxonomyOptions = useMemo(() => {
    const base = [{ label: 'Select taxonomy', value: '' }];
    return base.concat(taxonomies.map((tax) => ({ label: tax?.name || tax?.slug, value: tax?.slug })));
  }, [taxonomies]);

  const [postMetaKeys, setPostMetaKeys] = useState([]);
  const [termMetaKeysByTax, setTermMetaKeysByTax] = useState({});
  const [userMetaKeys, setUserMetaKeys] = useState([]);

  const taxonomiesInImageSteps = useMemo(() => {
    return Array.from(new Set(
      imageSteps.filter((step) => step?.type === 'terms' && step.value).map((step) => step.value)
    ));
  }, [imageSteps]);

  const taxonomiesInAltSteps = useMemo(() => {
    return Array.from(new Set(
      altSteps.filter((step) => step?.type === 'terms' && step.value).map((step) => step.value)
    ));
  }, [altSteps]);

  const taxonomiesInSteps = useMemo(() => {
    return Array.from(new Set([...taxonomiesInImageSteps, ...taxonomiesInAltSteps]));
  }, [taxonomiesInImageSteps, taxonomiesInAltSteps]);

  const hasAuthorStep = useMemo(() => {
    return imageSteps.some((step) => step?.type === 'author') || altSteps.some((step) => step?.type === 'author');
  }, [imageSteps, altSteps]);

  // Keep old saved values backward compatible while introducing library-specific manual override.
  const effectiveAltSource =
    imageSource === 'library'
      ? (rawAltSource === 'manual-library' ? 'manual-library' : (rawAltSource === 'dynamic' ? 'dynamic' : 'media-library'))
      : (rawAltSource === 'dynamic' ? 'dynamic' : 'manual');

  const needsDynamicAltData = effectiveAltSource === 'dynamic';

  useEffect(() => {
    if (imageSource === 'library' && effectiveAltSource !== 'manual-library') {
      setLocalAlt(image?.alt_text || '');
      return;
    }
    setLocalAlt(alt || '');
  }, [imageSource, effectiveAltSource, image?.alt_text, alt]);

  useEffect(() => {
    setLocalImageUrl(imageURL || '');
  }, [imageURL]);

  useEffect(() => {
    if (imageSource !== 'dynamic' && !needsDynamicAltData) return;

    let active = true;
    apiFetch({ path: `/tmsblocks/v1/meta-keys?postType=${encodeURIComponent(editorPostType)}` })
      .then((keys) => { if (active) setPostMetaKeys(Array.isArray(keys) ? keys : []); })
      .catch(() => { if (active) setPostMetaKeys([]); });
    return () => { active = false; };
  }, [imageSource, needsDynamicAltData, editorPostType]);

  useEffect(() => {
    if (imageSource !== 'dynamic' && !needsDynamicAltData) return;

    let active = true;
    taxonomiesInSteps.forEach((taxonomy) => {
      if (!taxonomy || termMetaKeysByTax[taxonomy]) return;
      apiFetch({ path: `/tmsblocks/v1/term-meta-keys?taxonomy=${encodeURIComponent(taxonomy)}` })
        .then((keys) => {
          if (!active) return;
          setTermMetaKeysByTax((prev) => ({ ...prev, [taxonomy]: Array.isArray(keys) ? keys : [] }));
        })
        .catch(() => {
          if (!active) return;
          setTermMetaKeysByTax((prev) => ({ ...prev, [taxonomy]: [] }));
        });
    });
    return () => { active = false; };
  }, [imageSource, needsDynamicAltData, taxonomiesInSteps, termMetaKeysByTax]);

  useEffect(() => {
    if ((imageSource !== 'dynamic' && !needsDynamicAltData) || !hasAuthorStep) {
      setUserMetaKeys([]);
      return;
    }

    let active = true;
    apiFetch({ path: '/tmsblocks/v1/user-meta-keys' })
      .then((keys) => { if (active) setUserMetaKeys(Array.isArray(keys) ? keys : []); })
      .catch(() => { if (active) setUserMetaKeys([]); });
    return () => { active = false; };
  }, [imageSource, needsDynamicAltData, hasAuthorStep]);

  useEffect(() => {
    if (imageSource !== 'dynamic' || !imagePath || !editorPostId) {
      setPreviewValue('');
      return;
    }

    let active = true;
    apiFetch({
      path: '/tmsblocks/v1/dynamic-field-preview',
      method: 'POST',
      data: {
        postId: editorPostId,
        path: imagePath,
      }
    })
      .then((response) => {
        if (!active) return;
        const values = Array.isArray(response?.values) ? response.values : [];
        setPreviewValue(values.length ? String(values[0]) : '');
      })
      .catch(() => {
        if (!active) return;
        setPreviewValue('');
      });
    return () => { active = false; };
  }, [imageSource, imagePath, editorPostId]);

  useEffect(() => {
    if (effectiveAltSource !== 'dynamic' || !altPath || !editorPostId) {
      setAltPreviewValue('');
      return;
    }

    let active = true;
    apiFetch({
      path: '/tmsblocks/v1/dynamic-field-preview',
      method: 'POST',
      data: {
        postId: editorPostId,
        path: altPath,
      }
    })
      .then((response) => {
        if (!active) return;
        const values = Array.isArray(response?.values) ? response.values : [];
        setAltPreviewValue(values.length ? String(values[0]) : '');
      })
      .catch(() => {
        if (!active) return;
        setAltPreviewValue('');
      });
    return () => { active = false; };
  }, [effectiveAltSource, altPath, editorPostId]);

  const handleSelect = (media) => {
    setAttributes({
      imageID: media.id,
      imageURL: ''
    });
  };

  const handleInsertFromUrl = () => {
    const nextUrl = (localImageUrl || '').trim();
    setAttributes({
      imageID: null,
      imageURL: nextUrl
    });
  };

  const handleClearCurrentSource = () => {
    if (imageSource === 'library') {
      setAttributes({ imageID: null });
      return;
    }

    if (imageSource === 'url') {
      setLocalImageUrl('');
      setAttributes({ imageURL: '' });
      return;
    }

    setPreviewValue('');
    setAttributes({
      imagePath: '',
      imageSteps: [{ type: '', value: '' }]
    });
  };

  const handleLinkTargetToggle = (openInNewTab) => {
    setAttributes({ linkTarget: openInNewTab ? '_blank' : '_self' });
  };

  const hasSourceValue =
    (imageSource === 'library' && imageID !== null && imageID !== undefined) ||
    (imageSource === 'url' && String(imageURL || localImageUrl || '').trim() !== '') ||
    (imageSource === 'dynamic' && (String(imagePath || '').trim() !== '' || (Array.isArray(imageSteps) && imageSteps.some((step) => step?.type || step?.value))));

  const isImageSourceModifiedByValue =
    (imageSource === 'library' && imageID !== null && imageID !== undefined) ||
    (imageSource === 'url' && String(imageURL || '').trim() !== '') ||
    (imageSource === 'dynamic' && (String(imagePath || '').trim() !== '' || (Array.isArray(imageSteps) && imageSteps.some((step) => step?.type || step?.value))));

  const postMetaOptions = useMemo(() => {
    return [{ label: 'Select meta key', value: '' }].concat(
      postMetaKeys.map((key) => ({ label: key, value: key }))
    );
  }, [postMetaKeys]);

  const termMetaOptionsByTax = useMemo(() => {
    const map = {};
    Object.keys(termMetaKeysByTax).forEach((taxonomy) => {
      map[taxonomy] = [{ label: 'Select meta key', value: '' }].concat(
        (termMetaKeysByTax[taxonomy] || []).map((key) => ({ label: key, value: key }))
      );
    });
    return map;
  }, [termMetaKeysByTax]);

  const userMetaOptions = useMemo(() => {
    return [{ label: 'Select meta key', value: '' }].concat(
      userMetaKeys.map((key) => ({ label: key, value: key }))
    );
  }, [userMetaKeys]);

  const updateImageSteps = (nextSteps) => {
    setAttributes({
      imageSteps: nextSteps,
      imagePath: stepsToPath(nextSteps)
    });
  };

  const updateAltSteps = (nextSteps) => {
    setAttributes({
      altSteps: nextSteps,
      altPath: stepsToPath(nextSteps)
    });
  };

  const libraryPreviewUrl = image?.source_url || '';
  const dynamicPreviewUrl = dynamicPreviewAttachment?.source_url || (isLikelyImageUrl(previewValue) ? previewValue.trim() : '');
  const activePreviewUrl =
    imageSource === 'library'
      ? libraryPreviewUrl
      : imageSource === 'url'
        ? (localImageUrl || imageURL || '').trim()
        : dynamicPreviewUrl;

  useEffect(() => {
    setIsPreviewBroken(false);
  }, [activePreviewUrl]);

  const handleAltChange = (val) => {
    setLocalAlt(val);
    if (imageSource !== 'library' || effectiveAltSource === 'manual-library') {
      setAttributes({ alt: val });
    }
  };

  const handleAltBlur = async () => {
    if (imageSource === 'library') {
      if (effectiveAltSource === 'manual-library') {
        setAttributes({ alt: (localAlt || '').trim() });
        return;
      }

      if (!imageID) return;
      await editEntityRecord('postType', 'attachment', imageID, {
        alt_text: localAlt
      });
      await saveEditedEntityRecord('postType', 'attachment', imageID);
      return;
    }

    setAttributes({ alt: (localAlt || '').trim() });
  };

  const isAltModifiedBySource =
    imageSource === 'library'
      ? (effectiveAltSource === 'dynamic'
          ? String(altPath || '').trim() !== ''
          : effectiveAltSource === 'manual-library' && String(alt || '').trim() !== '')
      : effectiveAltSource === 'dynamic'
        ? String(altPath || '').trim() !== ''
        : String(alt || '').trim() !== '';

  return (
    <>
      <div className="tmsblocks-image-settings__preview-row">
        {activePreviewUrl && !isPreviewBroken ? (
          <img
            src={activePreviewUrl}
            alt="Image thumbnail"
            onError={() => setIsPreviewBroken(true)}
            className="tmsblocks-image-settings__preview"
          />
        ) : (
          <div
            className="tmsblocks-image-settings__preview tmsblocks-image-settings__preview--empty"
            aria-hidden="true"
          />
        )}

        <Button
          variant="secondary"
          className="tmsblocks-image-settings__clear"
          isSmall
          onClick={handleClearCurrentSource}
          disabled={!hasSourceValue}
        >
          Clear source
        </Button>
      </div>

      <SelectControl
        label={<ControlLabel label="Image Source" isSet={isImageSourceModifiedByValue} />}
        value={imageSource}
        options={[
          { label: 'Media Library', value: 'library' },
          { label: 'URL', value: 'url' },
          { label: 'Dynamic Source', value: 'dynamic' }
        ]}
        onChange={(value) => setAttributes({ imageSource: value })}
      />

      {imageSource === 'library' && (
        <MediaUploadCheck>
          <MediaUpload
            onSelect={handleSelect}
            allowedTypes={['image']}
            value={imageID}
            render={({ open }) => (
              <Button
                onClick={open}
                variant="secondary"
                style={{ marginBottom: '16px' }}
              >
                {image ? 'Replace Image' : 'Select Image'}
              </Button>
            )}
          />
        </MediaUploadCheck>
      )}

      {imageSource === 'url' && (
        <>
          <TextControl
            label="Insert from URL"
            value={localImageUrl}
            onChange={setLocalImageUrl}
            onBlur={handleInsertFromUrl}
            placeholder="https://example.com/image.jpg"
          />
        </>
      )}

      {imageSource === 'dynamic' && (
        <div className="tmsblocks-image-settings__dynamic-group">
          <DynamicFieldStepBuilder
            steps={imageSteps}
            taxonomyOptions={taxonomyOptions}
            postMetaOptions={postMetaOptions}
            termMetaOptionsByTax={termMetaOptionsByTax}
            userMetaOptions={userMetaOptions}
            onPathChange={(newSteps, newPath) => setAttributes({ imageSteps: newSteps, imagePath: newPath })}
            renderAdvancedContent={() => (
              <>
                <DebugPathDisplay
                  label="Resolved image path"
                  value={imagePath}
                />

                <TextControl
                  label="Resolved image value"
                  value={previewValue}
                  readOnly
                  help="Preview of first resolved value for current post context."
                />
              </>
            )}
          />
        </div>
      )}

      

            <div className='tmsblocks-separator'></div>
            <SelectControl
              label="Link"
              value={linkType}
              options={[
                { label: 'None', value: 'none' },
                { label: 'Post permalink', value: 'post' },
                { label: 'Media file', value: 'media' },
                { label: 'Custom URL', value: 'custom' }
              ]}
              onChange={(value) => setAttributes({ linkType: value })}
            />

            {linkType === 'custom' && (
              <TextControl
                label="Custom link URL"
                value={linkUrl}
                onChange={(value) => setAttributes({ linkUrl: value })}
                placeholder="https://example.com"
              />
            )}

            {linkType !== 'none' && (
              <ToggleControl
                label="Open in new tab"
                checked={linkTarget === '_blank'}
                onChange={handleLinkTargetToggle}
              />
            )}

            <div className='tmsblocks-separator'></div>
      <SelectControl
        label="Alt source"
        value={effectiveAltSource}
        options={
          imageSource === 'library'
            ? [
                { label: 'Media Library (Synced)', value: 'media-library' },
                { label: 'Manual Override', value: 'manual-library' },
                { label: 'Dynamic Source', value: 'dynamic' }
              ]
            : [
                { label: 'Manual', value: 'manual' },
                { label: 'Dynamic Source', value: 'dynamic' }
              ]
        }
        onChange={(value) => setAttributes({ altSource: value })}
      />

      {effectiveAltSource === 'dynamic' ? (
        <div className="tmsblocks-image-settings__dynamic-group">
          <DynamicFieldStepBuilder
            steps={altSteps}
            taxonomyOptions={taxonomyOptions}
            postMetaOptions={postMetaOptions}
            termMetaOptionsByTax={termMetaOptionsByTax}
            userMetaOptions={userMetaOptions}
            onPathChange={(newSteps, newPath) => setAttributes({ altSteps: newSteps, altPath: newPath })}
            renderAdvancedContent={() => (
              <>
                <DebugPathDisplay
                  label="Resolved alt path"
                  value={altPath}
                />

                <TextControl
                  label="Resolved alt value"
                  value={altPreviewValue}
                  readOnly
                  help="Preview of first resolved alt value for current post context."
                />
              </>
            )}
          />
        </div>
      ) : (
        <TextControl
          label={<ControlLabel label="Alt Text" isSet={isAltModifiedBySource} />}
          value={localAlt}
          onChange={handleAltChange}
          onBlur={handleAltBlur}
          help={
            imageSource === 'library'
              ? (effectiveAltSource === 'manual-library'
                  ? 'Stored on this block only'
                  : 'Synced with media library (updates the attachment)')
              : 'Stored on this block only'
          }
        />
      )}

      <div className='tmsblocks-separator'></div>
      <SelectControl
        label={<ControlLabel label="Image Size" isSet={isStylePropSet(attributes, 'imageSize', { imageSize: 'full' })} />}
        value={imageSize}
        options={[
          { label: 'Full', value: 'full' },
          ...imageSizes.map((size) => ({
            label: size.name,
            value: size.slug
          }))
        ]}
        onChange={(val) => setAttributes({ imageSize: val })}
      />

      <SelectControl
        label={<ControlLabel label="Loading" isSet={isStylePropSet(attributes, 'loading', { loading: 'lazy' })} />}
        value={loading}
        options={[
          { label: 'Lazy (Default)', value: 'lazy' },
          { label: 'Eager', value: 'eager' }
        ]}
        onChange={(val) => setAttributes({ loading: val })}
      />

      <SelectControl
        label={<ControlLabel label="Decoding" isSet={decoding !== 'auto'} />}
        value={decoding}
        options={[
          { label: 'Auto (Default)', value: 'auto' },
          { label: 'Async', value: 'async' },
          { label: 'Sync', value: 'sync' },
        ]}
        onChange={(val) => setAttributes({ decoding: val })}
      />

      <SelectControl
        label={<ControlLabel label="Fetch Priority" isSet={!!fetchpriority} />}
        value={fetchpriority}
        options={[
          { label: 'Default', value: '' },
          { label: 'High', value: 'high' },
          { label: 'Low', value: 'low' },
          { label: 'Auto', value: 'auto' },
        ]}
        onChange={(val) => setAttributes({ fetchpriority: val })}
      />
    </>
  );
}

import React from 'react';
import {
  SelectControl,
  TextControl,
  Button,
  Notice,
} from '@wordpress/components';
import {
  MediaUpload,
  MediaUploadCheck,
} from '@wordpress/block-editor';
import DynamicFieldSettings from '../../../shared/src/controls/DynamicFieldSettings';
import ControlLabel from '../../../shared/src/controls/ControlLabel';
import DynamicFieldStepBuilder from '../../../shared/src/controls/DynamicFieldStepBuilder';

// Image attributes that make up the coupled "image source" group on an
// instance — reset together so ID / URL / path / alt / hints stay consistent.
const IMAGE_ATTR_KEYS = [
  'imageSource', 'imageID', 'imageURL', 'imagePath', 'imageSteps',
  'imageSize', 'alt', 'altSource', 'altPath', 'altSteps',
  'loading', 'decoding', 'fetchpriority',
];

const IMAGE_ATTR_DEFAULTS = {
  imageSource: 'library',
  imageID: null,
  imageURL: '',
  imagePath: '',
  imageSteps: [{ type: '', value: '' }],
  imageSize: 'full',
  alt: '',
  altSource: 'media-library',
  altPath: '',
  altSteps: [{ type: '', value: '' }],
  loading: 'lazy',
  decoding: 'auto',
  fetchpriority: '',
};

export default function ImgSettings({
  attributes,
  hasContext,
  contextPostId,
  imageSourceOptions,
  image,
  imageSizeOptions,
  effectiveAltSource,
  altSourceOptions,
  localAlt,
  localUrl,
  dynamicSrc,
  dynamicAlt,
  activePreviewUrl,
  previewBroken,
  hasSourceValue,
  taxonomyOptions,
  postMetaOptions,
  termMetaOptionsByTax,
  userMetaOptions,
  onSetPreviewBroken,
  onSetAttributes,
  onSelect,
  onInsertFromUrl,
  onSetLocalUrl,
  onClearCurrentSource,
  onAltChange,
  onAltBlur,
  onMediaLibraryClose,
  masterAttributes = null,
}) {
  const {
    imageSource = 'library',
    imageID = null,
    imageURL = '',
    imagePath = '',
    imageSteps = [{ type: '', value: '' }],
    imageSize = 'full',
    alt = '',
    altSource = 'media-library',
    altPath = '',
    altSteps = [{ type: '', value: '' }],
    loading = 'lazy',
    decoding = 'auto',
    fetchpriority = '',
    postSource = 'current',
    sourcePostId = 0,
    sourcePostType = '',
  } = attributes;

  // -- Wrapper-property dots --------------------------------------------------
  // Same convention as the other wrapper controls: NO dot on standalone, none
  // when both are at the default, purple when the instance matches the master,
  // orange when overridden. Paths use empty-empty -> no dot semantics.
  const wrapperLevel = (inst, def, master) =>
    masterAttributes ? (inst === def && master === def ? 0 : (inst === master ? 2 : 3)) : 0;
  const pathLevel = (instPath, masterPath) => {
    if (!masterAttributes) return 0;
    const m = masterPath ?? '';
    if (!instPath && !m) return 0;
    return instPath === m ? 2 : 3;
  };

  const imageSourceDot   = wrapperLevel(imageSource, 'library', masterAttributes?.imageSource ?? 'library');
  const imageIdDot       = wrapperLevel(imageID ?? null, null, masterAttributes?.imageID ?? null);
  // The URL field is only meaningful in URL mode. When the master uses the
  // library/dynamic/context source, its imageURL attribute just caches the
  // resolved image URL — it has no URL-field value, so the URL field's
  // "master default" is empty. This keeps an empty URL on a URL-mode
  // instance from showing orange against the master's cached library URL.
  const masterUrlSource = masterAttributes?.imageSource ?? 'library';
  const masterUrlValue  = masterUrlSource === 'url'
    ? (masterAttributes?.imageURL ?? '')
    : '';
  const imageURLDot     = wrapperLevel(imageURL, '', masterUrlValue);
  const imagePathDot     = pathLevel(imagePath, masterAttributes?.imagePath);
  const altSourceDot     = wrapperLevel(altSource, 'media-library', masterAttributes?.altSource ?? 'media-library');
  const altDot           = wrapperLevel(alt, '', masterAttributes?.alt ?? '');
  const altPathDot       = pathLevel(altPath, masterAttributes?.altPath);
  const imageSizeDot     = wrapperLevel(imageSize, 'full', masterAttributes?.imageSize ?? 'full');
  const loadingDot       = wrapperLevel(loading, 'lazy', masterAttributes?.loading ?? 'lazy');
  const decodingDot      = wrapperLevel(decoding, 'auto', masterAttributes?.decoding ?? 'auto');
  const fetchpriorityDot = wrapperLevel(fetchpriority, '', masterAttributes?.fetchpriority ?? '');

  // -- Reset image to master ---------------------------------------------------
  // A cleared/changed image on an instance is a valid override, but offer a
  // one-click way back to the master. Resets the whole coupled image group
  // and removes the matching overrides so the master value takes effect.
  const imageOverrides = attributes.componentOverrides || {};
  const hasImageOverrides = IMAGE_ATTR_KEYS.some((k) => k in imageOverrides);

  const resetImageToMaster = () => {
    const master = masterAttributes || {};
    const nextOverrides = { ...(attributes.componentOverrides || {}) };
    const patch = { componentOverrides: nextOverrides };
    for (const k of IMAGE_ATTR_KEYS) {
      delete nextOverrides[k];
      const def = IMAGE_ATTR_DEFAULTS[k];
      patch[k] = k in master
        ? master[k]
        : (Array.isArray(def) ? def.map((s) => ({ ...s })) : def);
    }
    onSetAttributes(patch);
  };

  return (
    <>
      {hasContext && (
        <Notice status="info" isDismissible={false} style={{ marginBottom: '12px' }}>
          Post Context available - #{contextPostId}
        </Notice>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        {activePreviewUrl && !previewBroken ? (
          <img
            src={activePreviewUrl}
            alt="Selected source"
            onError={() => onSetPreviewBroken(true)}
            style={{ width: '46px', height: '46px', objectFit: 'cover', borderRadius: '4px', background: '#f0f0f1' }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ width: '46px', height: '46px', borderRadius: '4px', background: '#f0f0f1' }}
          />
        )}

        <Button
          variant="secondary"
          isSmall
          onClick={onClearCurrentSource}
          disabled={!hasSourceValue || imageSource === 'context'}
        >
          Clear source
        </Button>
      </div>

      {masterAttributes && hasImageOverrides && (
        <Button
          variant="link"
          isSmall
          onClick={resetImageToMaster}
          style={{ marginBottom: '8px', padding: 0 }}
        >
          Reset image to master
        </Button>
      )}

      <SelectControl
        label={<ControlLabel label="Source" level={imageSourceDot} />}
        value={imageSource}
        options={imageSourceOptions}
        onChange={(v) => onSetAttributes({ imageSource: v, imageID: null, imageURL: '' })}
      />

      {imageSource === 'library' && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ControlLabel label="Image" level={imageIdDot} />
          </div>
          <MediaUploadCheck>
            <MediaUpload
              onSelect={onSelect}
              onClose={onMediaLibraryClose}
              allowedTypes={['image']}
              value={imageID}
              render={({ open }) => (
                <Button onClick={open} variant="secondary" style={{ marginBottom: '8px' }}>
                  {(image || hasSourceValue || activePreviewUrl || imageID) ? 'Replace Image' : 'Select Image'}
                </Button>
              )}
            />
          </MediaUploadCheck>
        </>
      )}

      {imageSource === 'url' && (
        <TextControl
          label={<ControlLabel label="URL" level={imageURLDot} />}
          value={localUrl}
          onChange={onSetLocalUrl}
          onBlur={onInsertFromUrl}
          placeholder="https://"
        />
      )}

      {imageSource === 'dynamic' && (
        <DynamicFieldSettings
          steps={imageSteps}
          path={imagePath}
          resolvedPath={imagePath}
          taxonomyOptions={taxonomyOptions}
          postMetaOptions={postMetaOptions}
          termMetaOptionsByTax={termMetaOptionsByTax}
          userMetaOptions={userMetaOptions}
          onPathChange={(steps, path) => onSetAttributes({ imageSteps: steps, imagePath: path })}
          showPostSourceControls={true}
          postSource={postSource}
          sourcePostId={sourcePostId}
          sourcePostType={sourcePostType}
          setAttributes={onSetAttributes}
          showPreview={!!imagePath}
          previewValue={dynamicSrc}
          showValueOptions={false}
          masterAttributes={masterAttributes}
          masterPathKey="imagePath"
        />
      )}

      {imageSource === 'context' && !hasContext && (
        <Notice status="warning" isDismissible={false}>
          No Post Context found as parent block.
        </Notice>
      )}

      

      <SelectControl
        label={<ControlLabel label="Alt" level={altSourceDot} />}
        value={effectiveAltSource}
        options={altSourceOptions}
        onChange={(v) => onSetAttributes({ altSource: v })}
      />

      {effectiveAltSource === 'dynamic' ? (
        <>
          <DynamicFieldStepBuilder
            steps={altSteps}
            label={<ControlLabel label="Content" level={altPathDot} />}
            taxonomyOptions={taxonomyOptions}
            postMetaOptions={postMetaOptions}
            termMetaOptionsByTax={termMetaOptionsByTax}
            userMetaOptions={userMetaOptions}
            onPathChange={(steps, path) => onSetAttributes({ altSteps: steps, altPath: path })}
            renderAdvancedContent={() => (
              altPath ? <TextControl label="Resolved alt" value={dynamicAlt} readOnly help="Preview for current post." /> : null
            )}
          />
        </>
      ) : effectiveAltSource === 'media-library' ? (
        <TextControl
          label={<ControlLabel label="Alt Text" level={altDot} />}
          value={localAlt}
          readOnly
          help="Synced from the media library. Switch to Manual Override to edit it per block."
        />
      ) : (
        <TextControl
          label={<ControlLabel label="Alt Text" level={altDot} />}
          value={localAlt}
          onChange={onAltChange}
          onBlur={onAltBlur}
          help={effectiveAltSource === 'media-library' ? 'Synced with media library' : undefined}
        />
      )}

      

      <SelectControl
        label={<ControlLabel label="Size" level={imageSizeDot} />}
        value={imageSize}
        options={imageSizeOptions}
        onChange={(v) => onSetAttributes({ imageSize: v })}
      />

      <SelectControl
        label={<ControlLabel label="Loading" level={loadingDot} />}
        value={loading}
        options={[
          { label: 'Lazy (Default)', value: 'lazy' },
          { label: 'Eager',          value: 'eager' },
        ]}
        onChange={(v) => onSetAttributes({ loading: v })}
      />

      <SelectControl
        label={<ControlLabel label="Decoding" level={decodingDot} />}
        value={decoding}
        options={[
          { label: 'Auto (Default)', value: 'auto' },
          { label: 'Async',          value: 'async' },
          { label: 'Sync',           value: 'sync' },
        ]}
        onChange={(v) => onSetAttributes({ decoding: v })}
      />

      <SelectControl
        label={<ControlLabel label="Fetch Priority" level={fetchpriorityDot} />}
        value={fetchpriority}
        options={[
          { label: 'Default', value: '' },
          { label: 'High',    value: 'high' },
          { label: 'Low',     value: 'low' },
          { label: 'Auto',    value: 'auto' },
        ]}
        onChange={(v) => onSetAttributes({ fetchpriority: v })}
      />
    </>
  );
}

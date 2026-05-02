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
}) {
  const {
    imageSource = 'library',
    imageID = null,
    imageURL = '',
    imagePath = '',
    imageSteps = [{ type: '', value: '' }],
    imageSize = 'full',
    altPath = '',
    altSteps = [{ type: '', value: '' }],
    loading = 'lazy',
    decoding = 'auto',
    fetchpriority = '',
    postSource = 'current',
    sourcePostId = 0,
    sourcePostType = '',
  } = attributes;

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

      <SelectControl
        label="Source"
        value={imageSource}
        options={imageSourceOptions}
        onChange={(v) => onSetAttributes({ imageSource: v, imageID: null, imageURL: '' })}
      />

      {imageSource === 'library' && (
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
      )}

      {imageSource === 'url' && (
        <TextControl
          label="URL"
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
        />
      )}

      {imageSource === 'context' && !hasContext && (
        <Notice status="warning" isDismissible={false}>
          No Post Context found as parent block.
        </Notice>
      )}

      

      <SelectControl
        label="Alt"
        value={effectiveAltSource}
        options={altSourceOptions}
        onChange={(v) => onSetAttributes({ altSource: v })}
      />

      {effectiveAltSource === 'dynamic' ? (
        <>
          <DynamicFieldStepBuilder
            steps={altSteps}
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
          label={<ControlLabel label="Alt Text" isSet={!!localAlt} />}
          value={localAlt}
          readOnly
          help="Synced from the media library. Switch to Manual Override to edit it per block."
        />
      ) : (
        <TextControl
          label={<ControlLabel label="Alt Text" isSet={!!localAlt} />}
          value={localAlt}
          onChange={onAltChange}
          onBlur={onAltBlur}
          help={effectiveAltSource === 'media-library' ? 'Synced with media library' : undefined}
        />
      )}

      

      <SelectControl
        label={<ControlLabel label="Size" isSet={imageSize !== 'full'} />}
        value={imageSize}
        options={imageSizeOptions}
        onChange={(v) => onSetAttributes({ imageSize: v })}
      />

      <SelectControl
        label={<ControlLabel label="Loading" isSet={loading !== 'lazy'} />}
        value={loading}
        options={[
          { label: 'Lazy (Default)', value: 'lazy' },
          { label: 'Eager',          value: 'eager' },
        ]}
        onChange={(v) => onSetAttributes({ loading: v })}
      />

      <SelectControl
        label={<ControlLabel label="Decoding" isSet={decoding !== 'auto'} />}
        value={decoding}
        options={[
          { label: 'Auto (Default)', value: 'auto' },
          { label: 'Async',          value: 'async' },
          { label: 'Sync',           value: 'sync' },
        ]}
        onChange={(v) => onSetAttributes({ decoding: v })}
      />

      <SelectControl
        label={<ControlLabel label="Fetch Priority" isSet={!!fetchpriority} />}
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

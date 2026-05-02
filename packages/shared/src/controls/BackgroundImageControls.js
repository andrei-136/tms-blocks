import React from 'react';
import {
  PanelBody,
  SelectControl,
  Button,
  TextControl
} from '@wordpress/components';
import {
  MediaUpload,
  MediaUploadCheck
} from '@wordpress/block-editor';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { hasModifiedStyleProps, isStylePropSet } from '../style-utils';

const BACKGROUND_SIZE_PRESETS = ['', 'auto', 'cover', 'contain', '100% 100%'];
const BACKGROUND_POSITION_PRESETS = ['', 'top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center', 'bottom right'];
const BACKGROUND_REPEAT_PRESETS = ['', 'no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'round', 'space'];
const BACKGROUND_ATTACHMENT_PRESETS = ['', 'scroll', 'fixed', 'local'];

const MODIFIED_PROPS = [
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',
];

function useCustomSelectState(currentValue, presets) {
  const isCustomValue = currentValue !== '' && !presets.includes(currentValue);
  const [isCustomSelected, setIsCustomSelected] = React.useState(isCustomValue);

  React.useEffect(() => {
    if (isCustomValue) setIsCustomSelected(true);
  }, [isCustomValue]);

  return [isCustomSelected, setIsCustomSelected, isCustomValue];
}

export default function BackgroundImageControls({
  customStyle = {},
  updateCustomStyle,
  usePanelBody = true,
}) {
  const currentBackgroundSize = customStyle.backgroundSize || '';
  const currentBackgroundPosition = customStyle.backgroundPosition || '';
  const currentBackgroundRepeat = customStyle.backgroundRepeat || '';
  const currentBackgroundAttachment = customStyle.backgroundAttachment || '';

  const [isSizeCustomSelected, setIsSizeCustomSelected, isSizeCustomValue] = useCustomSelectState(currentBackgroundSize, BACKGROUND_SIZE_PRESETS);
  const [isPositionCustomSelected, setIsPositionCustomSelected, isPositionCustomValue] = useCustomSelectState(currentBackgroundPosition, BACKGROUND_POSITION_PRESETS);
  const [isRepeatCustomSelected, setIsRepeatCustomSelected, isRepeatCustomValue] = useCustomSelectState(currentBackgroundRepeat, BACKGROUND_REPEAT_PRESETS);
  const [isAttachmentCustomSelected, setIsAttachmentCustomSelected, isAttachmentCustomValue] = useCustomSelectState(currentBackgroundAttachment, BACKGROUND_ATTACHMENT_PRESETS);

  const isModified = hasModifiedStyleProps(customStyle, MODIFIED_PROPS);

  const rawBackgroundImage = typeof customStyle.backgroundImage === 'object' && customStyle.backgroundImage !== null
    ? customStyle.backgroundImage.value ?? customStyle.backgroundImage.url ?? customStyle.backgroundImage.src ?? ''
    : customStyle.backgroundImage || '';

  const backgroundImageUrl = typeof rawBackgroundImage === 'string'
    ? rawBackgroundImage.replace(/^url\((['"]?)(.*?)\1\)$/i, '$2').trim()
    : '';
  const hasNonMediaBackgroundImage = !!rawBackgroundImage && !backgroundImageUrl;

  const handleSelectChange = (val, setter, prop) => {
    if (val === '__custom__') { setter(true); return; }
    setter(false);
    updateCustomStyle(prop, val || null);
  };

  const content = (
    <>
      {/* Thumbnail */}
      {backgroundImageUrl && (
        <img
          src={backgroundImageUrl}
          alt="Background thumbnail"
          style={{
            width: '64px',
            height: '64px',
            objectFit: 'cover',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        />
      )}

      {/* Image picker */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Image" isSet={isStylePropSet(customStyle, 'backgroundImage')} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MediaUploadCheck>
          <MediaUpload
            onSelect={(media) => updateCustomStyle('backgroundImage', media?.url ? `url("${media.url}")` : null)}
            allowedTypes={['image']}
            render={({ open }) => (
              <Button onClick={open} variant="secondary">
                {backgroundImageUrl ? 'Replace Image' : 'Select Image'}
              </Button>
            )}
          />
        </MediaUploadCheck>
        {backgroundImageUrl && (
          <Button
            onClick={() => updateCustomStyle('backgroundImage', null)}
            variant="tertiary"
            style={{ border: '1px solid currentColor' }}
          >
            Clear
          </Button>
        )}
      </div>

      {hasNonMediaBackgroundImage && (
        <div
          style={{
            fontSize: '12px',
            color: '#5a5a5a',
            marginBottom: '12px',
            padding: '8px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.55)',
          }}
        >
          Current background-image value is a CSS-generated image. Selecting a media image here will replace it.
        </div>
      )}

      {/* Background Size */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Size" isSet={isStylePropSet(customStyle, 'backgroundSize')} />
      </div>
      <SelectControl
        label="Size"
        hideLabelFromVision
        value={isSizeCustomSelected ? '__custom__' : currentBackgroundSize}
        options={[
          { label: 'Default', value: '' },
          { label: 'Auto', value: 'auto' },
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
          { label: '100% 100%', value: '100% 100%' },
          { label: 'Custom', value: '__custom__' },
        ]}
        onChange={(val) => handleSelectChange(val, setIsSizeCustomSelected, 'backgroundSize')}
      />
      {isSizeCustomSelected && (
        <TextControl
          label={<ControlLabel label="Custom Size" isSet={isStylePropSet(customStyle, 'backgroundSize')} />}
          value={isSizeCustomValue ? currentBackgroundSize : ''}
          onChange={(val) => updateCustomStyle('backgroundSize', val)}
          placeholder="e.g. 200px auto or clamp(120px, 20vw, 320px)"
        />
      )}

      {/* Background Position */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Position" isSet={isStylePropSet(customStyle, 'backgroundPosition')} />
      </div>
      <SelectControl
        label="Position"
        hideLabelFromVision
        value={isPositionCustomSelected ? '__custom__' : currentBackgroundPosition}
        options={[
          { label: 'Default', value: '' },
          { label: 'Top Left', value: 'top left' },
          { label: 'Top Center', value: 'top center' },
          { label: 'Top Right', value: 'top right' },
          { label: 'Center Left', value: 'center left' },
          { label: 'Center', value: 'center' },
          { label: 'Center Right', value: 'center right' },
          { label: 'Bottom Left', value: 'bottom left' },
          { label: 'Bottom Center', value: 'bottom center' },
          { label: 'Bottom Right', value: 'bottom right' },
          { label: 'Custom', value: '__custom__' },
        ]}
        onChange={(val) => handleSelectChange(val, setIsPositionCustomSelected, 'backgroundPosition')}
      />
      {isPositionCustomSelected && (
        <TextControl
          label={<ControlLabel label="Custom Position" isSet={isStylePropSet(customStyle, 'backgroundPosition')} />}
          value={isPositionCustomValue ? currentBackgroundPosition : ''}
          onChange={(val) => updateCustomStyle('backgroundPosition', val)}
          placeholder="e.g. 20px 40%"
        />
      )}

      {/* Background Repeat */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Repeat" isSet={isStylePropSet(customStyle, 'backgroundRepeat')} />
      </div>
      <SelectControl
        label="Repeat"
        hideLabelFromVision
        value={isRepeatCustomSelected ? '__custom__' : currentBackgroundRepeat}
        options={[
          { label: 'Default', value: '' },
          { label: 'No Repeat', value: 'no-repeat' },
          { label: 'Repeat', value: 'repeat' },
          { label: 'Repeat X', value: 'repeat-x' },
          { label: 'Repeat Y', value: 'repeat-y' },
          { label: 'Round', value: 'round' },
          { label: 'Space', value: 'space' },
          { label: 'Custom', value: '__custom__' },
        ]}
        onChange={(val) => handleSelectChange(val, setIsRepeatCustomSelected, 'backgroundRepeat')}
      />
      {isRepeatCustomSelected && (
        <TextControl
          label={<ControlLabel label="Custom Repeat" isSet={isStylePropSet(customStyle, 'backgroundRepeat')} />}
          value={isRepeatCustomValue ? currentBackgroundRepeat : ''}
          onChange={(val) => updateCustomStyle('backgroundRepeat', val)}
          placeholder="e.g. repeat space"
        />
      )}

      {/* Background Attachment */}
      <div style={{ marginBottom: '8px' }}>
        <ControlLabel label="Attachment" isSet={isStylePropSet(customStyle, 'backgroundAttachment')} />
      </div>
      <SelectControl
        label="Attachment"
        hideLabelFromVision
        value={isAttachmentCustomSelected ? '__custom__' : currentBackgroundAttachment}
        options={[
          { label: 'Default', value: '' },
          { label: 'Scroll', value: 'scroll' },
          { label: 'Fixed', value: 'fixed' },
          { label: 'Local', value: 'local' },
          { label: 'Custom', value: '__custom__' },
        ]}
        onChange={(val) => handleSelectChange(val, setIsAttachmentCustomSelected, 'backgroundAttachment')}
      />
      {isAttachmentCustomSelected && (
        <TextControl
          label={<ControlLabel label="Custom Attachment" isSet={isStylePropSet(customStyle, 'backgroundAttachment')} />}
          value={isAttachmentCustomValue ? currentBackgroundAttachment : ''}
          onChange={(val) => updateCustomStyle('backgroundAttachment', val)}
          placeholder="e.g. local"
        />
      )}

     
      
    </>
  );

  if (!usePanelBody) return content;

  return (
    <PanelBody
      title={<PanelTitle title="Background Image" isModified={isModified} />}
      initialOpen={false}
    >
      {content}
    </PanelBody>
  );
}

/**
 * BACKGROUND CONTROLS
 *
 * Single panel combining:
 * - Text color
 * - Background color
 * - Background visual (gradient or image)
 *
 * Gradient and image are mutually exclusive in saved attributes, but each mode
 * keeps a local draft for the current editor session so switching stays
 * flexible without saving inactive values.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { PanelBody, Button, SelectControl } from '@wordpress/components';
import ColorControls from './ColorControls';
import GradientControls from './GradientControls';
import BackgroundImageControls from './BackgroundImageControls';
import PanelTitle from './PanelTitle';
import ControlLabel from './ControlLabel';
import { computeNextStyle, getModificationLevel, isStylePropSet, MODIFICATION_LEVEL_COLORS } from '../style-utils';

const PRESET_GRADIENT_VAR_REGEX = /^var\(--wp--preset--gradient--([^)]+)\)$/;

const BACKGROUND_VISUAL_MODE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Image', value: 'image' },
];

const SECTION_LABEL_STYLE = {
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '8px',
};

const GROUP_STYLE = (bg) => ({
  background: bg,
  borderRadius: '4px',
  padding: '8px',
  marginBottom: '4px',
});

const ALL_PROPS = [
  'color',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',
];

const PROP_LABELS = {
  color: 'Color',
  backgroundColor: 'Background Color',
  backgroundImage: 'Background Visual',
  backgroundSize: 'Background Size',
  backgroundPosition: 'Background Position',
  backgroundRepeat: 'Background Repeat',
  backgroundAttachment: 'Background Attachment',
};

const IMAGE_STYLE_PROPS = [
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundAttachment',
];

const EMPTY_IMAGE_STYLE = {
  backgroundImage: null,
  backgroundSize: null,
  backgroundPosition: null,
  backgroundRepeat: null,
  backgroundAttachment: null,
};

function pickStyleProps(customStyle, props) {
  return props.reduce((acc, prop) => {
    if (Object.prototype.hasOwnProperty.call(customStyle, prop)) {
      acc[prop] = customStyle[prop];
    }
    return acc;
  }, {});
}

function extractBackgroundImageValue(backgroundImage) {
  if (!backgroundImage) return '';
  if (typeof backgroundImage === 'object') {
    return backgroundImage.value ?? backgroundImage.url ?? backgroundImage.src ?? '';
  }
  return backgroundImage;
}

function detectBackgroundVisualMode(backgroundImage) {
  const value = extractBackgroundImageValue(backgroundImage);
  if (!value || typeof value !== 'string') return 'none';
  if (/^url\((['"]?).*\1\)$/i.test(value.trim())) return 'image';
  if (/(?:repeating-)?(?:linear|radial|conic)-gradient\(/i.test(value) || PRESET_GRADIENT_VAR_REGEX.test(value)) {
    return 'gradient';
  }
  return 'image';
}

function createGradientDraft(customStyle) {
  if (detectBackgroundVisualMode(customStyle.backgroundImage) !== 'gradient') {
    return {};
  }

  return Object.prototype.hasOwnProperty.call(customStyle, 'backgroundImage')
    ? { backgroundImage: customStyle.backgroundImage }
    : {};
}

function createImageDraft(customStyle) {
  if (detectBackgroundVisualMode(customStyle.backgroundImage) !== 'image') {
    return {};
  }

  return pickStyleProps(customStyle, IMAGE_STYLE_PROPS);
}

function withDraftedGradient(customStyle, gradientDraft) {
  return {
    ...customStyle,
    backgroundImage: Object.prototype.hasOwnProperty.call(gradientDraft, 'backgroundImage')
      ? gradientDraft.backgroundImage
      : null,
  };
}

function withDraftedImage(customStyle, imageDraft) {
  return {
    ...customStyle,
    backgroundImage: Object.prototype.hasOwnProperty.call(imageDraft, 'backgroundImage')
      ? imageDraft.backgroundImage
      : null,
    backgroundSize: Object.prototype.hasOwnProperty.call(imageDraft, 'backgroundSize')
      ? imageDraft.backgroundSize
      : null,
    backgroundPosition: Object.prototype.hasOwnProperty.call(imageDraft, 'backgroundPosition')
      ? imageDraft.backgroundPosition
      : null,
    backgroundRepeat: Object.prototype.hasOwnProperty.call(imageDraft, 'backgroundRepeat')
      ? imageDraft.backgroundRepeat
      : null,
    backgroundAttachment: Object.prototype.hasOwnProperty.call(imageDraft, 'backgroundAttachment')
      ? imageDraft.backgroundAttachment
      : null,
  };
}

export default function BackgroundControls({ customStyle = {}, updateCustomStyle, masterStyle = null }) {
  const panelLevel = getModificationLevel(customStyle, ALL_PROPS, masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  // Only show properties that are actually overridden (orange, level 3) on instances,
  // or set/modified (blue, level 1) on standalone blocks.
  const overriddenProps = ALL_PROPS.filter(
    (prop) => getModificationLevel(customStyle, [prop], masterStyle) >= (masterStyle ? 3 : 1)
  );
  const hasOverrides = overriddenProps.length > 0;
  const inferredVisualMode = useMemo(
    () => detectBackgroundVisualMode(customStyle.backgroundImage),
    [customStyle.backgroundImage]
  );
  const isBackgroundVisualModified = inferredVisualMode !== 'none';
  const [backgroundVisualMode, setBackgroundVisualMode] = useState(inferredVisualMode);
  const [gradientDraft, setGradientDraft] = useState(() => createGradientDraft(customStyle));
  const [imageDraft, setImageDraft] = useState(() => createImageDraft(customStyle));

  useEffect(() => {
    if (inferredVisualMode === 'gradient') {
      setGradientDraft(createGradientDraft(customStyle));
    }

    if (inferredVisualMode === 'image') {
      setImageDraft(createImageDraft(customStyle));
    }
  }, [customStyle, inferredVisualMode]);

  const gradientControlStyle = useMemo(
    () => withDraftedGradient(customStyle, gradientDraft),
    [customStyle, gradientDraft]
  );

  const imageControlStyle = useMemo(
    () => withDraftedImage(customStyle, imageDraft),
    [customStyle, imageDraft]
  );

  const updateGradientDraft = (prop, value, unit) => {
    setGradientDraft((prev) => computeNextStyle(prev, prop, value, unit));
  };

  const updateImageDraft = (prop, value, unit) => {
    setImageDraft((prev) => computeNextStyle(prev, prop, value, unit));
  };

  const handleGradientStyleChange = (prop, value, unit) => {
    updateGradientDraft(prop, value, unit);
    if (backgroundVisualMode === 'gradient') {
      updateCustomStyle(prop, value, unit);
    }
  };

  const handleImageStyleChange = (prop, value, unit) => {
    updateImageDraft(prop, value, unit);
    if (backgroundVisualMode === 'image') {
      updateCustomStyle(prop, value, unit);
    }
  };

  const handleBackgroundVisualModeChange = (nextMode) => {
    if (nextMode === backgroundVisualMode) return;

    setBackgroundVisualMode(nextMode);

    if (nextMode === 'none') {
      updateCustomStyle(EMPTY_IMAGE_STYLE);
      return;
    }

    if (nextMode === 'gradient') {
      updateCustomStyle({
        ...EMPTY_IMAGE_STYLE,
        backgroundImage: Object.prototype.hasOwnProperty.call(gradientDraft, 'backgroundImage')
          ? gradientDraft.backgroundImage
          : null,
      });
      return;
    }

    updateCustomStyle({
      ...EMPTY_IMAGE_STYLE,
      ...pickStyleProps(imageDraft, IMAGE_STYLE_PROPS),
      backgroundImage: Object.prototype.hasOwnProperty.call(imageDraft, 'backgroundImage')
        ? imageDraft.backgroundImage
        : null,
    });
  };

  const resetToMasterValue = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;

  const handleClearPanelProperties = () => {
    const resetValues = {};
    overriddenProps.forEach((prop) => {
      resetValues[prop] = resetToMasterValue(prop);
    });
    // Also reset visual mode if backgroundImage is being reset
    if (resetValues.hasOwnProperty('backgroundImage')) {
      setBackgroundVisualMode('none');
      setGradientDraft({});
      setImageDraft({});
    }
    if (Object.keys(resetValues).length > 0) {
      updateCustomStyle(resetValues);
    }
  };

  return (
    <PanelBody
      title={<PanelTitle title="Colors & Background" level={panelLevel} />}
      initialOpen={false}
    >
      <div style={GROUP_STYLE('hsl(251, 50%, 94%)')}>
        <ColorControls
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          property="color"
          label="Color"
          usePanelBody={false}
          variant="button"
          masterStyle={masterStyle}
        />
      </div>

      <div style={GROUP_STYLE('hsl(251, 50%, 91%)')}>
        <ColorControls
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          property="backgroundColor"
          label="Background Color"
          usePanelBody={false}
          variant="button"
          masterStyle={masterStyle}
        />
      </div>

      <div style={GROUP_STYLE('hsl(251, 50%, 94%)')}>
        <label style={SECTION_LABEL_STYLE}>
          <ControlLabel label="Background Visual" isSet={isBackgroundVisualModified} />
        </label>
        <SelectControl
          label="Background Visual"
          hideLabelFromVision
          value={backgroundVisualMode}
          options={BACKGROUND_VISUAL_MODE_OPTIONS}
          onChange={handleBackgroundVisualModeChange}
          help="Gradient and image are mutually exclusive in saved attributes, but each mode keeps a temporary editor-session draft while this panel stays mounted."
        />

        {backgroundVisualMode === 'gradient' && (
          <GradientControls
            customStyle={gradientControlStyle}
            updateCustomStyle={handleGradientStyleChange}
            property="backgroundImage"
            label="Background Gradient"
            usePanelBody={false}
          />
        )}

        {backgroundVisualMode === 'image' && (
          <>
            <label style={SECTION_LABEL_STYLE}>Background Image</label>
            <BackgroundImageControls
              customStyle={imageControlStyle}
              updateCustomStyle={handleImageStyleChange}
              usePanelBody={false}
            />
          </>
        )}
      </div>

      {hasOverrides && (
        <div style={{ marginTop: '12px', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {overriddenProps.map((key) => (
              <span
                key={key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  background: '#f0f0f0',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  color: '#1e1e1e',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '999px',
                    backgroundColor: MODIFICATION_LEVEL_COLORS[getModificationLevel(customStyle, [key], masterStyle)] || MODIFICATION_LEVEL_COLORS[1],
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                {PROP_LABELS[key] ?? key}
                <button
                  onClick={() => updateCustomStyle(key, resetToMasterValue(key))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 0 0 2px',
                    lineHeight: 1,
                    color: '#757575',
                    fontSize: '12px',
                  }}
                  aria-label={`${clearLabel} ${PROP_LABELS[key] ?? key}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <Button
            variant="secondary"
            isDestructive
            onClick={handleClearPanelProperties}
          >
            {clearLabel} panel properties
          </Button>
        </div>
      )}
    </PanelBody>
  );
}

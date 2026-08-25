import React from 'react';

// Import all control components
import BackgroundControls from './BackgroundControls';
import BackgroundImageControls from './BackgroundImageControls';
import BorderControls from './BorderControls';
import ColorControls from './ColorControls';
import DimensionControls from './DimensionControls';
import DisplayControls from './DisplayControls';
import EffectsControls from './EffectsControls';
import GapControls from './GapControls';
import ItemControls from './ItemControls';
import ObjectControls from './ObjectControls';
import PositionControls from './PositionControls';
import SpacingControls from './SpacingControls';
import TypographyControls from './TypographyControls';
import TransitionControls from './TransitionControls';
import ClassNameControl from './ClassNameControl';
import WrapperControls from './WrapperControls';
import AnchorSettings from './AnchorSettings';
import ListSettings from './ListSettings';
import ListControls from './ListControls';
import ListItemSettings from './ListItemSettings';
import ImageSettings from './ImageSettings';
import StyleValuesPreview from './StyleValuesPreview';

/**
 * StyleControls Component
 * 
 * Renders individual style control components with explicit prop passing.
 * Allows selective exclusion of specific controls.
 * 
 * @param {Object} props
 * @param {Object} props.customStyle - The current custom style object
 * @param {Function} props.updateCustomStyle - Function to update custom styles
 * @param {Object} props.attributes - Block attributes object (className, utilityClasses, etc.)
 * @param {Array<string>} props.exclude - Array of control names to exclude
 * @param {Array<string>} props.include - Array of control names to explicitly include (takes precedence over exclude)
 * @param {Array<string>} props.allow - Alias of include for explicit control inclusion
 * @param {Object} props.allowedUnits - Allowed units for various controls
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {Object<string, Object>} props.controlProps - Optional per-control props map (e.g. { Wrapper: { showTagNameControl: false } })
 * 
 * @example
 * <StyleControls 
 *   customStyle={customStyle} 
 *   updateCustomStyle={updateCustomStyle}
 *   attributes={attributes}
 *   setAttributes={setAttributes}
 *   exclude={['Effects', 'Grid']}
 * />
 */
export default function StyleControls({
  attributes = {},
  updateCustomStyle,
  exclude = [],
  include = [],
  allow = [],
  allowedUnits = ['px', 'rem', 'em', '%', 'vw', 'vh', 'unitless', 'custom', 'size-presets'],
  setAttributes,
  controlProps = {},
  clientId,
  showStyleValuesPreview = false,
  masterAttributes = null,
  masterStyle: masterStyleOverride = null,
}) {
  const { customStyle = {}, tmsClassName = '', utilityClasses = '' } = attributes;
  const masterStyle = masterStyleOverride ?? (masterAttributes?.customStyle || null);
  
  // Available control names for exclusion:
  // 'Background', 'BackgroundImage', 'Border', 'Color', 'Dimension', 'Display', 'Effects', 'Transition',
  // 'Flexbox', 'FlexItem', 'Gap', 'Grid', 'GridItem', 'Image', 'List', 'ListItem', 'Anchor', 'Object', 'Position', 'Spacing', 'Typography', 'ClassName', 'Wrapper'
  
  // Default exclusions - always exclude these unless explicitly included
  const DEFAULT_EXCLUDE = [ 'Color','BackgroundImage', 'Object', 'List', 'ListItem', 'Anchor', 'Image', 'Wrapper', 'ClassName'];
  // Merge custom exclude with defaults
  const mergedExclude = [...new Set([...DEFAULT_EXCLUDE, ...exclude])];
  const mergedInclude = [...new Set([...include, ...allow])];

  const shouldRender = (name) => mergedInclude.includes(name) || !mergedExclude.includes(name);
  const getControlProps = (name) => controlProps[name] || {};
  const canRenderItemControls = shouldRender('FlexItem') || shouldRender('GridItem');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {shouldRender('Anchor') && (
        <AnchorSettings
          attributes={attributes}
          setAttributes={setAttributes}
          {...getControlProps('Anchor')}
        />
      )}
      {shouldRender('List') && (
        <ListControls
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          masterStyle={masterStyle}
          {...getControlProps('List')}
        />
      )}
      {shouldRender('ListItem') && (
        <ListItemSettings
          attributes={attributes}
          setAttributes={setAttributes}
          customStyle={customStyle}
          updateCustomStyle={updateCustomStyle}
          {...getControlProps('ListItem')}
        />
      )}
      {shouldRender('Image') && (
        <ImageSettings
          attributes={attributes}
          setAttributes={setAttributes}
          {...getControlProps('Image')}
        />
      )}
      {shouldRender('Display') && (
          <DisplayControls
            customStyle={customStyle}
            updateCustomStyle={updateCustomStyle}
            utilityClasses={utilityClasses}
            setAttributes={setAttributes}
            masterStyle={masterStyle}
            {...getControlProps('Display')}
          />
      )}
      {canRenderItemControls && (
          <ItemControls
            customStyle={customStyle}
            updateCustomStyle={updateCustomStyle}
            clientId={clientId}
            allowFlexItem={shouldRender('FlexItem')}
            allowGridItem={shouldRender('GridItem')}
            masterStyle={masterStyle}
            {...getControlProps('Item')}
          />
      )}
      {shouldRender('Gap') && (
          <GapControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Gap')} />
      )}
      {shouldRender('Dimension') && (
          <DimensionControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Dimension')} />
      )}
      {shouldRender('Spacing') && (
          <SpacingControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={['px', 'rem', 'em', '%', 'vw', 'vh', 'custom', 'size-presets']} {...getControlProps('Spacing')} />
      )}
      {shouldRender('Typography') && (
          <TypographyControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Typography')} />
      )}
      {shouldRender('Color') && (
          <ColorControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Color')} />
      )}
      {shouldRender('Background') && (
          <BackgroundControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Background')} />
      )}
      {shouldRender('BackgroundImage') && (
          <BackgroundImageControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} allowedUnits={allowedUnits} {...getControlProps('BackgroundImage')} />
      )}
      {shouldRender('Border') && (
          <BorderControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Border')} />
      )}
      {shouldRender('Effects') && (
          <EffectsControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Effects')} />
      )}
      {shouldRender('Position') && (
          <PositionControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterStyle={masterStyle} allowedUnits={allowedUnits} {...getControlProps('Position')} />
      )}
        {shouldRender('Transition') && (
          <TransitionControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} masterTransitionConfig={masterAttributes?.transitionConfig ?? null} {...getControlProps('Transition')} />
        )}
      {shouldRender('Object') && (
          <ObjectControls customStyle={customStyle} updateCustomStyle={updateCustomStyle} allowedUnits={allowedUnits} {...getControlProps('Object')} />
      )}
       {shouldRender('ClassName')  && (
          <ClassNameControl value={tmsClassName} onChange={(val) => setAttributes({ tmsClassName: val })} {...getControlProps('ClassName')} />
      )}
      {shouldRender('Wrapper') && (
        <WrapperControls
          attributes={attributes}
          setAttributes={setAttributes}
          masterAttributes={masterAttributes}
                    {...getControlProps('Wrapper')}
        />
      )}
      {showStyleValuesPreview && <StyleValuesPreview attributes={attributes} />}
    </div>
  );
}

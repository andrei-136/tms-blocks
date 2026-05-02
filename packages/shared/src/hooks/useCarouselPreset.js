// useCarouselPreset.js
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { carouselPresets } from '../presets';

export function useCarouselPreset(clientId) {
    const { updateBlockAttributes } = useDispatch(blockEditorStore);
    
    const { carouselBlock, wrapperBlock, trackBlock } = useSelect((select) => {
        const { getBlock } = select(blockEditorStore);
        
        // Get the carousel block (top level)
        const carousel = getBlock(clientId);
        
        // Find wrapper (child of carousel)
        const wrapper = carousel?.innerBlocks?.find(
            block => block.name === 'tmsblocks/carousel-wrapper'
        );
        // Find track (child of wrapper)
        const track = wrapper?.innerBlocks?.find(
            block => block.name === 'tmsblocks/carousel-track'
        );
        
        return {
            carouselBlock: carousel,
            wrapperBlock: wrapper,
            trackBlock: track
        };
    }, [clientId]);
    
    const applyPreset = (presetKey) => {
        if (!presetKey || !carouselPresets[presetKey]) {
            // Clear preset
            if (carouselBlock) {
                updateBlockAttributes(carouselBlock.clientId, {
                    currentPreset: ''
                });
            }
            return;
        }
        
        const preset = carouselPresets[presetKey];
        
        // Apply to carousel (top level)
        if (carouselBlock && preset.styles.carousel) {
            updateBlockAttributes(carouselBlock.clientId, {
                customStyle: {
                    ...carouselBlock.attributes.customStyle,
                    ...preset.styles.carousel
                },
                currentPreset: presetKey,
                ...preset.settings
            });
        }
        
        // Apply to wrapper
        if (wrapperBlock && preset.styles.wrapper) {
            const updatedWrapperStyle = {
                ...(wrapperBlock.attributes.customStyle || {}),
                ...preset.styles.wrapper
            };
            updateBlockAttributes(wrapperBlock.clientId, {
                customStyle: updatedWrapperStyle
            });
            
        }
        
      
        // Apply to track
    if (trackBlock) {
        updateBlockAttributes(trackBlock.clientId, {
            customStyle: {
                ...(trackBlock.attributes.customStyle || {}),
                ...(preset.styles.track || {})
            },
            customClassStyle: {
                ...(trackBlock.attributes.customClassStyle || {}),
                ...(preset.styles.slides || {})
            }
        });
    }
        };
    
    return { applyPreset };
}

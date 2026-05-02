// presets.js
export const carouselPresets = {
    'card-carousel': {
        label: 'Fixed Carousel Height',
        description: 'Carousel has a set height, slides adapt to fit',
        styles: {
            carousel: {
                // Styles for top-level carousel block
                height: { value: '400', unit: 'px' }
            },
            wrapper: {
                height: { value: '100', unit: '%' },
            },
            track: {
                height: { value: '100', unit: '%'},
            },
            slides: {
                height: { value: '100', unit: '%' },
                width: { value: '100', unit: '%' },
            }
        }
    },
    'hero-slider': {
        label: 'Hero Slider',
        description: 'Full-width with fixed height',
        styles: {
            carousel: {
                // Styles for top-level carousel block
            },
            wrapper: {
                padding: { value: '0', unit: 'px' }
            },
            track: {
                gap: { value: '0', unit: 'px' }
            },
            slides: {
                width: { value: '100', unit: '%' },
                minHeight: { value: '500', unit: 'px' },
                padding: { value: '60', unit: 'px' }
            }
        }
    }
};

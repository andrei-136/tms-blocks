// PresetSelector.js
import { SelectControl, Button } from '@wordpress/components';
import { carouselPresets } from '../presets';

export default function PresetSelector({ currentPreset, onApplyPreset }) {
    return (
        <div>
            <SelectControl
                label="Choose Preset"
                value={currentPreset || ''}
                options={[
                    { label: 'Custom (no preset)', value: '' },
                    ...Object.entries(carouselPresets).map(([key, preset]) => ({
                        label: preset.label,
                        value: key
                    }))
                ]}
                onChange={onApplyPreset}
                help={
                    currentPreset && carouselPresets[currentPreset]
                        ? carouselPresets[currentPreset].description
                        : 'Choose a preset or customize manually'
                }
            />
            
            {currentPreset && (
                <Button
                    isDestructive
                    isSmall
                    onClick={() => onApplyPreset('')}
                    style={{ marginTop: '8px' }}
                >
                    Clear Preset
                </Button>
            )}
        </div>
    );
}

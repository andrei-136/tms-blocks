import React from 'react';
import { ToggleControl, RangeControl, SelectControl, TextControl } from '@wordpress/components';
import ControlLabel from './ControlLabel';

export default function TruncateControls({ attributes, setAttributes, preview }) {
    const {
        truncateEnabled = false,
        truncateLength  = 200,
        truncateUnit    = 'characters',
        truncateSuffix  = '...',
    } = attributes;

    return (
        <>
            <ToggleControl
                label={<ControlLabel label="Truncate text" isSet={truncateEnabled} />}
                checked={truncateEnabled}
                onChange={(v) => setAttributes({ truncateEnabled: v })}
            />
            {truncateEnabled && (
                <>
                    <SelectControl
                        label="Unit"
                        value={truncateUnit}
                        options={[
                            { label: 'Characters', value: 'characters' },
                            { label: 'Words',      value: 'words' },
                        ]}
                        onChange={(v) => setAttributes({ truncateUnit: v })}
                    />
                    <RangeControl
                        label="Length"
                        value={truncateLength}
                        onChange={(v) => setAttributes({ truncateLength: v })}
                        min={10}
                        max={truncateUnit === 'words' ? 100 : 1000}
                        step={truncateUnit === 'words' ? 1 : 10}
                    />
                    <TextControl
                        label="Suffix"
                        value={truncateSuffix}
                        onChange={(v) => setAttributes({ truncateSuffix: v })}
                        placeholder="..."
                    />
                    <div style={{ marginTop: '8px' }}>
                        <strong>Truncate preview:</strong>
                        <div
                            style={{
                                maxHeight: '120px',
                                marginTop: '6px',
                                padding: '8px 10px',
                                overflow: 'auto',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: '#f6f7f7',
                                lineHeight: '1.5',
                                wordBreak: 'break-word',
                            }}
                        >
                            {preview
                                ? <span dangerouslySetInnerHTML={{ __html: preview }} />
                                : <span>{truncateSuffix || ''}</span>
                            }
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
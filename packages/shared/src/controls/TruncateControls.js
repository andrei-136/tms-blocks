import React from 'react';
import { ToggleControl, RangeControl, SelectControl, TextControl } from '@wordpress/components';
import ControlLabel from './ControlLabel';

const DEFAULT_LENGTH = 200;
const DEFAULT_UNIT   = 'characters';
const DEFAULT_SUFFIX = '...';

export default function TruncateControls({ attributes, setAttributes, preview, masterAttributes = null }) {
    const {
        truncateEnabled = false,
        truncateLength  = DEFAULT_LENGTH,
        truncateUnit    = DEFAULT_UNIT,
        truncateSuffix  = DEFAULT_SUFFIX,
    } = attributes;

    const masterLength = masterAttributes?.truncateLength ?? DEFAULT_LENGTH;
    const masterUnit   = masterAttributes?.truncateUnit   ?? DEFAULT_UNIT;
    const masterSuffix = masterAttributes?.truncateSuffix ?? DEFAULT_SUFFIX;

    // Wrapper-property dot convention: no blue on standalone; purple when the
    // instance matches the master, orange when overridden, none when both default.
    const truncateLevel = (inst, def, master) =>
        masterAttributes
            ? (inst === def && master === def ? 0 : (inst === master ? 2 : 3))
            : 0;

    const unitLevel   = truncateLevel(truncateUnit,   DEFAULT_UNIT,   masterUnit);
    const lengthLevel = truncateLevel(truncateLength, DEFAULT_LENGTH, masterLength);
    const suffixLevel = truncateLevel(truncateSuffix, DEFAULT_SUFFIX, masterSuffix);

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
                        label={<ControlLabel label="Unit" level={unitLevel} />}
                        value={truncateUnit}
                        options={[
                            { label: 'Characters', value: 'characters' },
                            { label: 'Words',      value: 'words' },
                        ]}
                        onChange={(v) => setAttributes({ truncateUnit: v })}
                    />
                    <RangeControl
                        label={<ControlLabel label="Length" level={lengthLevel} />}
                        value={truncateLength}
                        onChange={(v) => setAttributes({ truncateLength: v })}
                        min={10}
                        max={truncateUnit === 'words' ? 100 : 1000}
                        step={truncateUnit === 'words' ? 1 : 10}
                    />
                    <TextControl
                        label={<ControlLabel label="Suffix" level={suffixLevel} />}
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
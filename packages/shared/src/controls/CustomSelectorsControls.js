import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getCustomSelectorsEntryLevel, MODIFICATION_LEVEL_COLORS } from '../style-utils';

/**
 * Normalizes customSelectors to the per-breakpoint object shape.
 * Backward compat: flat array → { desktop: array }.
 */
function normalizeSelectors(raw) {
	if (Array.isArray(raw)) return { desktop: raw };
	if (raw && typeof raw === 'object') return raw;
	return {};
}

/**
 * CustomSelectorsControls
 *
 * Split-panel UI: a compact selector list at the top, and the full style
 * controls for the *selected* selector rendered below via renderStyleControls.
 *
 * Now per-breakpoint: reads/writes `customSelectors[activeBreakpoint]`.
 */
export default function CustomSelectorsControls({
	customSelectors = {},
	onChange = () => {},
	blockClassName = '.tmsblocks-block-xyz',
	renderStyleControls,
	activeBreakpoint = 'desktop',
	masterAttributes = null,
}) {
	const normalized = useMemo(() => normalizeSelectors(customSelectors), [customSelectors]);
	const entries = Array.isArray(normalized[activeBreakpoint]) ? normalized[activeBreakpoint] : [];
	const [ activeIndex, setActiveIndex ] = useState(null);

	const emitChange = useCallback((nextEntries) => {
		onChange({ ...normalized, [activeBreakpoint]: nextEntries });
	}, [ normalized, activeBreakpoint, onChange ]);

	const handleAdd = useCallback(() => {
		const next = [ ...entries, { selector: '&', customStyle: {} } ];
		emitChange(next);
		setActiveIndex(next.length - 1);
	}, [ entries, emitChange ]);

	const handleRemove = useCallback((index) => {
		const next = entries.filter((_, i) => i !== index);
		emitChange(next);
		if (activeIndex === index) setActiveIndex(null);
		else if (activeIndex > index) setActiveIndex(activeIndex - 1);
	}, [ entries, emitChange, activeIndex ]);

	const handleUpdateEntry = useCallback((index, patch) => {
		emitChange(entries.map((e, i) => i === index ? { ...e, ...patch } : e));
	}, [ entries, emitChange ]);

	const activeEntry = activeIndex !== null && activeIndex >= 0 && activeIndex < entries.length
		? entries[ activeIndex ]
		: null;

	const hasMaster        = masterAttributes != null;
	const masterNormalized = useMemo(
		() => (masterAttributes ? normalizeSelectors(masterAttributes.customSelectors || {}) : {}),
		[ masterAttributes ]
	);
	const masterEntries = hasMaster
		? (Array.isArray(masterNormalized[activeBreakpoint]) ? masterNormalized[activeBreakpoint] : [])
		: null;

	const activeEntryMaster = hasMaster && activeEntry
		? (masterEntries.find((e) => (e.selector || '') === (activeEntry.selector || '')) || null)
		: null;

	return (
		<div style={{ overflow: 'hidden', padding: '0 8px' }}>
			<p style={{ fontSize: '11px', color: '#757575', margin: '0 0 10px', wordBreak: 'break-word' }}>
				{ __( 'Use', 'tms-blocks' ) } <code>&amp;</code>{ ' ' }
				{ __( 'for the block\'s CSS class.', 'tms-blocks' ) }
				<br />
				{ __( 'Example:', 'tms-blocks' ) }{ ' ' }
				<code>&amp;:hover</code>, <code>&amp;::before</code>, <code>&amp; ul li</code>
			</p>

			{/* ---- Selector list ---- */}
			{ entries.length > 0 && (
				<div style={{ marginBottom: '12px' }}>
					{ entries.map((entry, index) => {
						const isActive = activeIndex === index;
						const masterEntry = hasMaster
							? (masterEntries.find((e) => (e.selector || '') === (entry.selector || '')) || masterEntries[index])
							: null;
						const level = getCustomSelectorsEntryLevel(entry, masterEntry, hasMaster);

						return (
							<label
								key={index}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
									padding: '4px 0',
									cursor: 'pointer',
									minWidth: 0,
								}}
							>
								<input
									type="radio"
									name="tms-custom-selector"
									checked={isActive}
									onChange={() => setActiveIndex(index)}
									style={{ margin: 0, flexShrink: 0, width: '14px', height: '14px' }}
								/>
								{level > 0 && (
									<span
										aria-hidden="true"
										style={{
											width: '5px',
											height: '5px',
											borderRadius: '999px',
											backgroundColor: MODIFICATION_LEVEL_COLORS[level] || MODIFICATION_LEVEL_COLORS[1],
											flexShrink: 0,
										}}
									/>
								)}
								<input
									type="text"
									value={entry.selector || ''}
									onChange={(e) => {
									let v = e.target.value.replace(/[{};]/g, '');
									if (v && v.indexOf('&') === -1) v = '&' + v;
									handleUpdateEntry(index, { selector: v });
								}}
									placeholder="&"
									style={{
										flex: '1 1 auto',
										minWidth: '40px',
										border: 'none',
										borderBottom: '1px solid #dcdcde',
										outline: 'none',
										fontFamily: 'monospace',
										fontSize: '12px',
										padding: '2px 0',
										background: 'transparent',
									}}
								/>
								<Button
									isSmall
									isDestructive
									variant="tertiary"
									onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
									icon="no-alt"
									label={ __( 'Remove selector', 'tms-blocks' ) }
									style={{ flexShrink: 0, minWidth: '24px' }}
								/>
							</label>
						);
					}) }
				</div>
			) }

			<Button
				variant="secondary"
				isSmall
				onClick={handleAdd}
				style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
			>
				+ { __( 'Add selector', 'tms-blocks' ) }
			</Button>

			{/* ---- Active selector styles ---- */}
			{ activeEntry && renderStyleControls && (
				<div style={{
					borderTop: '1px solid #e0e0e0',
					paddingTop: '8px',
				}}>
					<p style={{
						fontSize: '11px',
						fontWeight: 600,
						textTransform: 'uppercase',
						margin: '0 0 8px',
						color: '#1e1e1e',
						overflowWrap: 'break-word',
					}}>
						{ __( 'Styles for', 'tms-blocks' ) }:{ ' ' }
						<code>{ activeEntry.selector }</code>
					</p>
					{ renderStyleControls(
						activeEntry,
						(patch) => handleUpdateEntry(activeIndex, patch),
						() => handleRemove(activeIndex),
						activeIndex,
						activeEntryMaster
					) }
				</div>
			) }
		</div>
	);
}


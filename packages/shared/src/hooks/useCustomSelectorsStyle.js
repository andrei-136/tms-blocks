import { useMemo } from 'react';
import { useStyleOverride } from '@wordpress/block-editor';
import { customSelectorsToEditorCSS } from '../style-utils';

/**
 * Injects custom CSS selectors into the editor for a block.
 * Handles per-breakpoint selectors and wraps non-desktop in @media.
 *
 * Data shape: { desktop: [...], tablet: [...], mobile: [...] }
 * For backward compat, a flat array is treated as { desktop: array }.
 */
export default function useCustomSelectorsStyle({
	uniqueId,
	clientId,
	classPrefix = 'tmsblocks-block',
	customSelectors = {},
	breakpointOverrides = {},
	customBreakpoints = [],
}) {
	const uniqueClassName = uniqueId ? `${classPrefix}-${uniqueId}` : '';

	const css = useMemo(
		() => customSelectorsToEditorCSS(
			customSelectors,
			uniqueClassName,
			breakpointOverrides,
			customBreakpoints
		),
		[ customSelectors, uniqueClassName, breakpointOverrides, customBreakpoints ]
	);

	useStyleOverride({
		id: `tmsblocks-custom-selectors-${clientId}`,
		css,
	});
}

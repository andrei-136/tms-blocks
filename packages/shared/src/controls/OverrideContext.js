/**
 * React context for component instance override status.
 *
 * tms-component-system provides this context with a Set of attribute keys
 * that have been overridden on the current block. PanelTitle and ControlLabel
 * consume it to switch the isModified/isSet dot color from blue to orange.
 *
 * @package TMSBlocks
 */

import { createContext, useContext } from 'react';

/**
 * @type {React.Context<Set<string>>}
 */
const OverrideContext = createContext( new Set() );

export default OverrideContext;

/**
 * Returns true when the given attribute key is currently overridden
 * on a component instance block.
 *
 * @param {string} attrKey
 * @return {boolean}
 */
export function useIsOverridden( attrKey ) {
	const overriddenKeys = useContext( OverrideContext );
	return overriddenKeys.has( attrKey );
}

/**
 * Returns true when any attribute is overridden on the current block.
 *
 * @return {boolean}
 */
export function useAnyOverridden() {
	const overriddenKeys = useContext( OverrideContext );
	return overriddenKeys.size > 0;
}

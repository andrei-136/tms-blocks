/**
 * Module-level store for component override dot colors.
 *
 * Shared between tms-component-system (writer) and
 * PanelTitle / ControlLabel (readers) to color the isModified/isSet
 * indicator dots based on component instance override status.
 *
 * @package TMSBlocks
 */

const _store = new Map();

/**
 * Sets the override dot color for a given attribute key.
 *
 * @param {string} attrKey Attribute key.
 * @param {string} color   CSS color value.
 */
export function setOverrideDotColor( attrKey, color ) {
	_store.set( attrKey, color );
}

/**
 * Returns the override dot color for an attribute key, or null if none.
 *
 * @param {string} attrKey Attribute key.
 * @return {string|null}
 */
export function getOverrideDotColor( attrKey ) {
	return _store.get( attrKey ) || null;
}

/**
 * Clears all stored override dot colors.
 */
export function clearOverrideDotColors() {
	_store.clear();
}

/**
 * Returns true when at least one override dot color is in the store.
 * Used by PanelTitle / ControlLabel as a signal to switch dot color
 * when attrKey is not explicitly passed.
 *
 * @return {boolean}
 */
export function hasOverrideDotColors() {
	return _store.size > 0;
}

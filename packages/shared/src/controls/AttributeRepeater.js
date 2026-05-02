import React from 'react';
import { Button, SelectControl, TextControl } from '@wordpress/components';
import ControlLabel from './ControlLabel';

// -- AttributeRepeater --------------------------------------------------------
// Reusable key-value repeater for HTML attributes.
//
// Props:
//   label          - string, shown as section label
//   value          - array of { type, key, value } objects
//   onChange       - function(newArray)
//   allowedKeys    - array of allowed key strings. 'data-*' is treated as a
//                    special case: the user picks 'data-*' from the dropdown
//                    and types the suffix in a second input.
//   showEmptyRow   - boolean (default false). When true, always shows at least
//                    one blank row in the UI. The stored value stays [] until
//                    the user actually fills something in.
//
// Storage format:
//   [
//     { type: 'data-*',        key: 'data-track',    value: 'hero'  },
//     { type: 'tabindex',      key: 'tabindex',      value: '0'     },
//     { type: 'aria-controls', key: 'aria-controls', value: 'nav'   },
//     { type: 'aria-hidden',   key: 'aria-hidden',   value: 'true'  },
//   ]
//
// `type` drives the UI (which dropdown option is selected).
// `key`  is the final resolved attribute name written to HTML.
// Boolean attributes auto-set value to 'true' and hide the value input.

const DATA_PREFIX = 'data-';
const DATA_WILDCARD = 'data-*';
const EMPTY_ENTRY = { type: '', key: '', value: '' };

// Attributes that are boolean/keyword - no value input needed.
// Value is stored as 'true' automatically when selected.
const BOOLEAN_KEYS = new Set([
  // ARIA boolean
  'aria-atomic',
  'aria-busy',
  'aria-disabled',
  'aria-hidden',
  'aria-multiline',
  'aria-multiselectable',
  'aria-readonly',
  'aria-required',
  // HTML boolean
  'download',
]);

const styles = {
  wrapper: {
    border: '1px solid rgb(220, 220, 222)',
    borderRadius: '6px',
    padding: '10px',
    backgroundColor: 'rgb(255, 255, 255)',
    marginBottom: '12px',
  },
  rowsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px',
  },
  row: {
    display: 'grid',
    gap: '4px',
    alignItems: 'end',
    padding: '6px 0',
    borderBottom: '1px solid rgb(240, 240, 241)',
  },
  rowLast: {
    borderBottom: 'none',
    paddingBottom: '0',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingTop: '4px',
  },
  addLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#1e1e1e',
  },
  addButton: {
    borderRadius: '4px',
    minWidth: '20px',
    width: '20px',
    height: '20px',
    padding: '0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  removeButton: {
    minWidth: '20px',
    width: '20px',
    height: '20px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginBottom: '2px',
    flexShrink: 0,
  },
};

export default function AttributeRepeater({ label, value = [], onChange, allowedKeys = [], showEmptyRow = false, keywordValueMap = {} }) {
  const displayValue = showEmptyRow && value.length === 0 ? [EMPTY_ENTRY] : value;
  const hasEntries = displayValue.length > 0;
  const hasDataOption = allowedKeys.some((k) => k === DATA_WILDCARD || k.startsWith(DATA_PREFIX));
  const selectOptions = [
    { label: '-- select --', value: '' },
    ...allowedKeys
      .filter((k) => k !== DATA_WILDCARD && !k.startsWith(DATA_PREFIX))
      .map((k) => ({ label: k, value: k })),
    ...(hasDataOption ? [{ label: 'data-*', value: DATA_WILDCARD }] : []),
  ];

  const addEntry = () => {
    onChange([...value, { ...EMPTY_ENTRY }]);
  };

  const removeEntry = (index) => {
    if (showEmptyRow && value.length === 0) return;
    onChange(value.filter((_, i) => i !== index));
  };

  const updateEntry = (index, patch) => {
    const base = showEmptyRow && value.length === 0 ? [{ ...EMPTY_ENTRY }] : value;
    onChange(base.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const handleKeyTypeChange = (index, selectedType) => {
    if (selectedType === DATA_WILDCARD) {
      updateEntry(index, { type: DATA_WILDCARD, key: '', value: '' });
    } else if (BOOLEAN_KEYS.has(selectedType)) {
      updateEntry(index, { type: selectedType, key: selectedType, value: 'true' });
    } else if (keywordValueMap[selectedType]) {
      updateEntry(index, { type: selectedType, key: selectedType, value: keywordValueMap[selectedType][0].value });
    } else {
      updateEntry(index, { type: selectedType, key: selectedType, value: '' });
    }
  };

  const handleDataSuffixChange = (index, suffix) => {
    const clean = suffix.toLowerCase().replace(/[^a-z0-9-]/g, '');
    updateEntry(index, { key: clean ? `${DATA_PREFIX}${clean}` : '' });
  };

  const getDataSuffix = (key) =>
    typeof key === 'string' && key.startsWith(DATA_PREFIX)
      ? key.slice(DATA_PREFIX.length)
      : '';

  return (
    <div style={styles.wrapper} className="tmsblocks-attribute-repeater">
      <div style={{ marginBottom: hasEntries ? '4px' : '0' }}>
        <ControlLabel label={label} />
      </div>

      {hasEntries && (
        <div style={styles.rowsWrapper}>
          {displayValue.map((entry, index) => {
            const isData    = entry.type === DATA_WILDCARD;
            const isBoolean = BOOLEAN_KEYS.has(entry.type);
            const isKeyword = !isBoolean && !isData && !!keywordValueMap[entry.type];
            const isLast    = index === displayValue.length - 1;

            const gridTemplateColumns =
              isData    ? '1fr 1fr 1fr auto' :
              isBoolean ? '1fr auto' :
                          '1fr 1fr auto';

            return (
              <div
                key={index}
                style={{
                  ...styles.row,
                  ...(isLast ? styles.rowLast : {}),
                  gridTemplateColumns,
                }}
              >
                <SelectControl
                  label="Attribute"
                  hideLabelFromVision
                  value={entry.type || ''}
                  options={selectOptions}
                  onChange={(val) => handleKeyTypeChange(index, val)}
                  __nextHasNoMarginBottom
                />

                {isData && (
                  <TextControl
                    label="Suffix"
                    hideLabelFromVision
                    value={getDataSuffix(entry.key)}
                    onChange={(val) => handleDataSuffixChange(index, val)}
                    placeholder="track"
                    __nextHasNoMarginBottom
                  />
                )}

                {!isBoolean && !isKeyword && (
                  <TextControl
                    label="Value"
                    hideLabelFromVision
                    value={entry.value}
                    onChange={(val) => updateEntry(index, { value: val })}
                    placeholder="value"
                    __nextHasNoMarginBottom
                  />
                )}

                {isKeyword && (
                  <SelectControl
                    label="Value"
                    hideLabelFromVision
                    value={entry.value}
                    options={keywordValueMap[entry.type]}
                    onChange={(val) => updateEntry(index, { value: val })}
                    __nextHasNoMarginBottom
                  />
                )}

                <Button
                  isSmall
                  isDestructive
                  onClick={() => removeEntry(index)}
                  style={styles.removeButton}
                  aria-label="Remove attribute"
                >
                  &times;
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.footer}>
        <span style={styles.addLabel}>Add attribute</span>
        <Button
          isSmall
          variant="secondary"
          onClick={addEntry}
          style={styles.addButton}
          aria-label="Add attribute"
        >
          +
        </Button>
      </div>
    </div>
  );
}

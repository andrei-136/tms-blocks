/**
 * GAP CONTROLS
 * 
 * Controls for CSS gap property (works with flex and grid displays)
 */

import React, { useState } from 'react';
import { PanelBody, ToggleControl, Button } from '@wordpress/components';
import UnitControls, { KEYWORDS_GLOBAL, KEYWORDS_TEXT } from './UnitControls';
import ControlLabel from './ControlLabel';
import PanelTitle from './PanelTitle';
import { getModificationLevel, MODIFICATION_LEVEL_COLORS } from '../style-utils';

const GAP_KEYWORDS = [
  ...KEYWORDS_TEXT.filter(k => k.value === 'normal'),
  ...KEYWORDS_GLOBAL,
];

const GAP_UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh', 'custom', 'size-presets', 'keywords'];

export default function GapControls({
  customStyle = {},
  updateCustomStyle,
  masterStyle = null
}) {
  const gap = customStyle.gap;
  const rowGap = customStyle.rowGap;
  const columnGap = customStyle.columnGap;
  
  const [useRowColumn, setUseRowColumn] = useState(!!(rowGap || columnGap));
  
  const handleGapChange = (value) => {
    updateCustomStyle({ gap: value || null, rowGap: null, columnGap: null });
  };
  
  const handleRowGapChange = (value) => {
    updateCustomStyle({ rowGap: value || null, gap: null });
  };
  
  const handleColumnGapChange = (value) => {
    updateCustomStyle({ columnGap: value || null, gap: null });
  };
  
  const handleRowColumnToggle = (enabled) => {
    setUseRowColumn(enabled);
    if (enabled) {
      updateCustomStyle(gap
        ? { rowGap: gap, columnGap: gap, gap: null }
        : { rowGap: null, columnGap: null, gap: null }
      );
    } else {
      updateCustomStyle((rowGap && columnGap)
        ? { gap: rowGap, rowGap: null, columnGap: null }
        : { gap: null, rowGap: null, columnGap: null }
      );
    }
  };

  const gapLevel = getModificationLevel(customStyle, ['gap', 'rowGap', 'columnGap'], masterStyle);
  const getLevel = (prop) => getModificationLevel(customStyle, [prop], masterStyle);
  const clearLabel = masterStyle ? 'Reset' : 'Clear';
  const resetToMaster = (prop) => masterStyle ? (masterStyle[prop] ?? null) : null;
  
  return (
    <PanelBody title={<PanelTitle title="Gap" level={gapLevel} />} initialOpen={false}>
      <ToggleControl
        label="Different row/column gaps"
        checked={useRowColumn}
        onChange={handleRowColumnToggle}
      />
      
      {!useRowColumn ? (
        <UnitControls
          label={<ControlLabel label="Gap" level={getLevel('gap')} />}
          value={gap}
          onChange={handleGapChange}
          allowedUnits={GAP_UNITS}
          keywords={GAP_KEYWORDS}
        />
      ) : (
        <>
          <UnitControls
            label={<ControlLabel label="Column Gap (horizontal)" level={getLevel('columnGap')} />}
            value={columnGap}
            onChange={handleColumnGapChange}
            allowedUnits={GAP_UNITS}
            keywords={GAP_KEYWORDS}
          />
          <UnitControls
            label={<ControlLabel label="Row Gap (vertical)" level={getLevel('rowGap')} />}
            value={rowGap}
            onChange={handleRowGapChange}
            allowedUnits={GAP_UNITS}
            keywords={GAP_KEYWORDS}
          />
        </>
      )}

      {gapLevel > 0 && (
        <Button
          variant="secondary"
          isDestructive
          onClick={() => updateCustomStyle({
            gap: resetToMaster('gap'),
            rowGap: resetToMaster('rowGap'),
            columnGap: resetToMaster('columnGap'),
          })}
          style={{ marginTop: '8px' }}
        >
          {clearLabel} panel properties
        </Button>
      )}
    </PanelBody>
  );
}

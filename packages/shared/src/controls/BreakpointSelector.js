import React, { useEffect, useMemo, useState } from 'react';
import { Button, Modal, TextControl } from '@wordpress/components';
import { BREAKPOINTS_MAP } from '../breakpoints';
import ControlLabel from './ControlLabel';

export default function BreakpointSelector({
  allBreakpoints = [],
  activeBreakpoint = 'desktop',
  setBreakpoint,
  isDesktopModified = false,
  getBreakpointIsSet = () => false,
  breakpointOverrides = {},
  setAttributes,
}) {
  const [editingKey, setEditingKey] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [pendingReset, setPendingReset] = useState(false);

  const editingBreakpoint = useMemo(
    () => allBreakpoints.find((breakpoint) => breakpoint.key === editingKey) || null,
    [allBreakpoints, editingKey]
  );

  useEffect(() => {
    if (!editingBreakpoint) {
      setDraftValue('');
      setPendingReset(false);
      return;
    }

    const overrideValue = breakpointOverrides?.[editingBreakpoint.key];
    const nextValue = overrideValue ?? editingBreakpoint.maxWidth ?? '';
    setDraftValue(nextValue === '' ? '' : String(nextValue));
    setPendingReset(false);
  }, [editingBreakpoint, breakpointOverrides]);

  const parsedDraftValue = Number.parseInt(draftValue, 10);
  const canApply = pendingReset || (Number.isFinite(parsedDraftValue) && parsedDraftValue > 0);
  const hasOverride = !!(editingBreakpoint && breakpointOverrides?.[editingBreakpoint.key] !== undefined);
  const defaultMaxWidth = editingBreakpoint
    ? BREAKPOINTS_MAP[editingBreakpoint.key]?.maxWidth ?? editingBreakpoint.maxWidth
    : null;

  const handleApply = () => {
    if (!editingBreakpoint || !canApply) {
      return;
    }

    if (pendingReset) {
      const nextOverrides = { ...(breakpointOverrides || {}) };
      delete nextOverrides[editingBreakpoint.key];
      setAttributes({ breakpointOverrides: nextOverrides });
      setEditingKey(null);
      return;
    }

    setAttributes({
      breakpointOverrides: {
        ...(breakpointOverrides || {}),
        [editingBreakpoint.key]: parsedDraftValue,
      },
    });
    setEditingKey(null);
  };

  const handleReset = () => {
    if (!editingBreakpoint) {
      return;
    }

    setDraftValue(defaultMaxWidth ? String(defaultMaxWidth) : '');
    setPendingReset(true);
  };

  const getGroupStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'stretch',
    border: `1px solid ${isActive ? 'var(--wp-admin-theme-color, #3858e9)' : '#c3c4c7'}`,
    borderRadius: '4px',
    overflow: 'hidden',
    background: isActive ? 'var(--tms-accent, #3858e9)' : '#fff',
    
  });

  const getMainButtonStyle = (isActive) => ({
    border: 0,
    borderRadius: 0,
    boxShadow: 'none',
    height: '24px',
    minHeight: '24px',
    padding: '0 10px',
    background: 'transparent',
    color: '#1e1e1e',
  });

  const getEditButtonStyle = (isActive) => ({
    border: 0,
    borderRadius: 0,
    boxShadow: 'none',
    minWidth: '30px',
    width: '30px',
    height: '24px',
    minHeight: '24px',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: 'transparent',
    color: isActive ? '#fff' : '#50575e',
    borderLeft: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.3)' : '#c3c4c7'}`,
  });

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '8px 16px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div style={getGroupStyle(activeBreakpoint === 'desktop')}>
          <Button
            variant="tertiary"
            onClick={() => setBreakpoint('desktop')}
            style={getMainButtonStyle(activeBreakpoint === 'desktop')}
          >
            <ControlLabel label="Desktop" isSet={isDesktopModified} />
          </Button>
        </div>

        {allBreakpoints.map(({ key, label }) => {
          const isActive = activeBreakpoint === key;
          const isOverridden = breakpointOverrides?.[key] !== undefined;

          return (
          <div key={key} style={getGroupStyle(isActive)}>
            <Button
              variant="tertiary"
              onClick={() => setBreakpoint(key)}
              style={getMainButtonStyle(isActive)}
            >
              <ControlLabel label={label} isSet={getBreakpointIsSet(key)} />
            </Button>
            <Button
              variant="tertiary"
              onClick={() => setEditingKey(key)}
              aria-label={`Edit ${label} breakpoint`}
              title={isOverridden ? `Edit ${label} breakpoint (override set)` : `Edit ${label} breakpoint`}
              style={getEditButtonStyle(isActive)}
            >
              <span className="dashicons dashicons-edit" aria-hidden="true" />
              {isOverridden && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '999px',
                    backgroundColor: '#d97706',
                    boxShadow: isActive ? '0 0 0 1px rgba(255, 255, 255, 0.9)' : '0 0 0 1px #fff',
                  }}
                />
              )}
            </Button>
          </div>
        );})}
      </div>

      {editingBreakpoint && (
        <Modal
          title={`Edit ${editingBreakpoint.label} breakpoint`}
          onRequestClose={() => setEditingKey(null)}
          shouldCloseOnClickOutside={false}
        >
          <div style={{ width: 'min(360px, 90vw)' }}>
            <p style={{ marginTop: 0, marginBottom: '12px' }}>
              Set the max-width for this block in px.
              {defaultMaxWidth ? ` Default: ${defaultMaxWidth}px.` : ''}
            </p>
            <TextControl
              label={`${editingBreakpoint.label} max-width`}
              type="number"
              value={draftValue}
              min={1}
              step={1}
              onChange={(nextValue) => {
                setDraftValue(nextValue === undefined ? '' : String(nextValue));
                setPendingReset(false);
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setEditingKey(null)}>
                Cancel
              </Button>
              {hasOverride && (
                <Button variant="secondary" isDestructive onClick={handleReset}>
                  Reset
                </Button>
              )}
              <Button variant="primary" onClick={handleApply} disabled={!canApply}>
                Apply
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
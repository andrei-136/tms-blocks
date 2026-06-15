import React, { useMemo } from 'react';
import { BaseControl, SelectControl, TextControl, TextareaControl } from '@wordpress/components';
import DynamicFieldStepBuilder from './DynamicFieldStepBuilder';
import SourcePostControls from './PostSearchSelector';

function DebugPathDisplay({ label, value }) {
  return (
    <BaseControl label={label}>
      <div
        style={{
          padding: '6px 10px',
          border: '1px solid #dcdcde',
          borderRadius: '2px',
          background: '#f2f0f9',
          color: '#50575e',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: 1.4,
          wordBreak: 'break-all',
          minHeight: '30px',
        }}
      >
        {value || 'Not set'}
      </div>
    </BaseControl>
  );
}

function BuilderSection({ children }) {
  return (
    <div
      style={{
        margin: '12px 0',
        padding: '12px',
        border: '1px solid #e0e4e7',
        borderRadius: '4px',
        background: '#f2f0f9',
      }}
    >
      {children}
    </div>
  );
}

import ControlLabel from './ControlLabel';

export default function DynamicFieldSettings({
  steps = [],
  path = '',
  resolvedPath = '',
  separator = ', ',
  emptyText = '',
  dateFormat = '',
  commentsNoText = '',
  commentsOneText = '',
  commentsManyText = '',
  taxonomyOptions = [],
  postMetaOptions = [],
  termMetaOptionsByTax = {},
  userMetaOptions = [],
  onPathChange,
  onSeparatorChange,
  onEmptyTextChange,
  onDateFormatChange,
  onCommentsNoTextChange,
  onCommentsOneTextChange,
  onCommentsManyTextChange,
  showPostSourceControls = false,
  postSource = 'current',
  sourcePostId = 0,
  sourcePostType = '',
  setAttributes,
  showPreview = false,
  previewLabel = 'Preview',
  previewValue = '',
  previewHelp = '',
  showValueOptions = true,
  masterAttributes = null,
}) {
  // Dot for post source — orange when instance differs from master.
  // masterAttributes.postSource may be absent from the snapshot.
  const postSourceDot = useMemo(() => {
    if (!masterAttributes) return 0;
    const masterVal = masterAttributes.postSource;
    if (masterVal === undefined || masterVal === null) return (postSource !== 'current' ? 3 : 0);
    return masterVal !== postSource ? 3 : 0;
  }, [masterAttributes, postSource]);
  const hasDateStep = Array.isArray(steps)
    && steps.some((step) => step?.type === 'post' && (step?.value === 'date' || step?.value === 'modified'));

  const hasCommentsStep = Array.isArray(steps)
    && steps.some((step) => step?.type === 'comments');

  // Dot helpers: orange when instance value differs from master
  const getDot = (key, currentVal, defaultVal = '') => {
    if (!masterAttributes) return 0;
    const masterVal = masterAttributes[key];
    if (masterVal === undefined || masterVal === null) return (currentVal !== defaultVal ? 3 : 0);
    return masterVal !== currentVal ? 3 : 0;
  };

  return (
    <BuilderSection>
      {showPostSourceControls && (
        <>
          <SelectControl
            label={<ControlLabel label="Post Source" level={postSourceDot} />}
            value={postSource}
            options={[
              { label: 'Current', value: 'current' },
              { label: 'Specific', value: 'specific' },
            ]}
            onChange={(value) => {
              if (!setAttributes) return;
              if (value === 'current') {
                setAttributes({ postSource: value, sourcePostId: 0, sourcePostType: '' });
                return;
              }
              setAttributes({ postSource: value });
            }}
          />
          {postSource === 'specific' && !!setAttributes && (
            <SourcePostControls
              sourcePostType={sourcePostType}
              sourcePostId={sourcePostId}
              setAttributes={setAttributes}
              masterAttributes={masterAttributes}
            />
          )}
        </>
      )}

        <DynamicFieldStepBuilder
          steps={steps}
          taxonomyOptions={taxonomyOptions}
          postMetaOptions={postMetaOptions}
          termMetaOptionsByTax={termMetaOptionsByTax}
          userMetaOptions={userMetaOptions}
          onPathChange={onPathChange}
          renderAdvancedContent={() => (
            <>
              <DebugPathDisplay
                label="Path"
                value={resolvedPath || path}
              />

              {showPreview && (
                <TextareaControl
                  label={previewLabel}
                  value={previewValue}
                  readOnly
                  rows={3}
                  help={previewHelp || undefined}
                />
              )}
            </>
          )}
        />

      {showValueOptions && (
        <>
          <TextControl
            label={<ControlLabel label="Separator" level={getDot('separator', separator)} />}
            value={separator}
            onChange={onSeparatorChange}
          />

          

          {hasDateStep && (
            <TextControl
              label={<ControlLabel label="Date format" level={getDot('dynamicDateFormat', dateFormat)} />}
              value={dateFormat}
              onChange={onDateFormatChange}
            />
          )}

          {hasCommentsStep && (
            <>
              <TextControl
                label={<ControlLabel label="No comments text" level={getDot('dynamicCommentsNoText', commentsNoText)} />}
                value={commentsNoText}
                onChange={onCommentsNoTextChange}
              />

              <TextControl
                label={<ControlLabel label="Single comment text" level={getDot('dynamicCommentsOneText', commentsOneText)} />}
                value={commentsOneText}
                onChange={onCommentsOneTextChange}
              />

              <TextControl
                label={<ControlLabel label="Plural comments text" level={getDot('dynamicCommentsManyText', commentsManyText)} />}
                value={commentsManyText}
                onChange={onCommentsManyTextChange}
                help="Use %s for the comments count placeholder."
              />
            </>
          )}

          <TextControl
            label={<ControlLabel label="Empty value text" level={getDot('emptyText', emptyText)} />}
            value={emptyText}
            onChange={onEmptyTextChange}
          />
        </>
      )}

    </BuilderSection>
  );
}

import React from 'react';
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
}) {
  const hasDateStep = Array.isArray(steps)
    && steps.some((step) => step?.type === 'post' && (step?.value === 'date' || step?.value === 'modified'));

  const hasCommentsStep = Array.isArray(steps)
    && steps.some((step) => step?.type === 'comments');

  return (
    <BuilderSection>
      {showPostSourceControls && (
        <>
          <SelectControl
            label="Post Source"
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
            label="Separator"
            value={separator}
            onChange={onSeparatorChange}
          />

          

          {hasDateStep && (
            <TextControl
              label="Date format"
              value={dateFormat}
              onChange={onDateFormatChange}
            />
          )}

          {hasCommentsStep && (
            <>
              <TextControl
                label="No comments text"
                value={commentsNoText}
                onChange={onCommentsNoTextChange}
              />

              <TextControl
                label="Single comment text"
                value={commentsOneText}
                onChange={onCommentsOneTextChange}
              />

              <TextControl
                label="Plural comments text"
                value={commentsManyText}
                onChange={onCommentsManyTextChange}
                help="Use %s for the comments count placeholder."
              />
            </>
          )}

          <TextControl
            label="Empty value text"
            value={emptyText}
            onChange={onEmptyTextChange}
          />
        </>
      )}

    </BuilderSection>
  );
}

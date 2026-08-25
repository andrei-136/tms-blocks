/**
 * CONTENT CONTROLS
 *
 * Text input for the CSS `content` property — needed by pseudo-elements
 * (::before, ::after) to actually render.
 *
 * Follows the same composite pattern as boxShadow / dropShadow:
 *   { value: '"s"', unit: 'custom', source: 's' }
 *
 * `source` is the user's raw text (the part, source of truth).
 * `value` is the derived CSS string (auto-quoted from source unless
 * it's a CSS function or keyword).
 */

import React from 'react';
import { PanelBody, TextControl } from '@wordpress/components';
import PanelTitle from './PanelTitle';

const CSS_CONTENT_FUNCTIONS = /^(url|attr|counter|counters)\(/i;
const CSS_CONTENT_KEYWORDS  = /^(none|normal|open-quote|close-quote|no-open-quote|no-close-quote)$/;

/** Given raw user input, return the CSS value (quoted if needed). */
function toCssValue(source) {
  if (!source) return '';
  if (CSS_CONTENT_FUNCTIONS.test(source) || CSS_CONTENT_KEYWORDS.test(source)) return source;
  // Already quoted by the user
  if ((source[0] === '"' && source[source.length - 1] === '"') ||
      (source[0] === "'" && source[source.length - 1] === "'")) return source;
  return `"${source}"`;
}

export default function ContentControls({ customStyle = {}, updateCustomStyle }) {
  const contentObj = customStyle.content;
  const hasParts   = contentObj && typeof contentObj === 'object' && contentObj.source !== undefined;
  const source     = hasParts ? (contentObj.source || '') : (typeof contentObj === 'string' ? contentObj : '');
  const level      = source ? 1 : 0;

  const handleChange = (v) => {
    const trimmed = v ? v.trim() : '';
    updateCustomStyle('content', trimmed
      ? { value: toCssValue(trimmed), unit: 'custom', source: trimmed }
      : { value: '""', unit: 'custom', source: '' }
    );
  };

  return (
    <PanelBody
      title={<PanelTitle title="Content" level={level} />}
      initialOpen={!!source}
    >
      <TextControl
        label="CSS content value"
        help={'e.g. "→", url("icon.svg"), attr(data-label), counter(ch)'}
        value={source}
        onChange={handleChange}
        __nextHasNoMarginBottom
      />
      <p style={{
        marginTop:   '10px',
        fontSize:    '11px',
        fontStyle:   'italic',
        color:       'var(--tmsblocks-text-muted, #4a5a5a)',
        borderLeft:  '3px solid var(--tmsblocks-accent, #FFC928)',
        paddingLeft: '8px',
      }}>
        Pseudo-elements require a content value to render.
      </p>
    </PanelBody>
  );
}

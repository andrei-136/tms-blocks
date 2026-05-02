import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TextControl,
  SelectControl,
  Spinner,
  Button,
} from '@wordpress/components';
import {
  MediaUpload,
  MediaUploadCheck,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import ControlLabel from './ControlLabel';

// â”€â”€ Hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function usePostTypeOptions() {
  const postTypes = useSelect((select) => {
    return select('core').getPostTypes({ per_page: -1 }) || [];
  }, []);

  const options = useMemo(() => {
    return postTypes
      .filter((pt) => pt.viewable || pt.slug === 'attachment')
      .map((pt) => ({ label: pt.labels?.singular_name || pt.slug, value: pt.slug }));
  }, [postTypes]);

  const restBaseBySlug = useMemo(() => {
    return postTypes.reduce((acc, pt) => {
      if (pt?.slug) acc[pt.slug] = pt.rest_base || pt.slug;
      return acc;
    }, {});
  }, [postTypes]);

  return { options, restBaseBySlug };
}

function usePostSearch(postType, search, restBaseBySlug) {
  const [results, setResults] = useState([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!postType) { setResults([]); return; }
    let active = true;
    setLoading(true);
    const restBase = restBaseBySlug?.[postType] || postType;
    const path = postType === 'attachment'
      ? `/wp/v2/media?per_page=20&search=${encodeURIComponent(search || '')}`
      : `/wp/v2/${restBase}?per_page=20&search=${encodeURIComponent(search || '')}&status=any`;
    apiFetch({ path })
      .then((posts) => { if (active) setResults(Array.isArray(posts) ? posts : []); })
      .catch(() => { if (active) setResults([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [postType, search, restBaseBySlug]);

  return { results, isLoading };
}

// â”€â”€ Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function PostSearchSelector({ postType, restBaseBySlug, value, onChange }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { results, isLoading } = usePostSearch(postType, debouncedQ, restBaseBySlug);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (post) => {
    onChange(post.id);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '8px' }}>
      <TextControl
        label={<ControlLabel label="Search post" isSet={value > 0} />}
        value={search}
        onChange={(v) => { setSearch(v); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder="Type to search..."
        autoComplete="off"
      />

      {isOpen && (
        <div style={{
          position: 'absolute',
          zIndex: 100,
          left: 0, right: 0,
          background: '#fff',
          border: '1px solid #dcdcde',
          borderRadius: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {isLoading && (
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#757575', fontSize: '12px' }}>
              <Spinner /> Searching...
            </div>
          )}
          {!isLoading && results.length === 0 && (
            <div style={{ padding: '8px 12px', color: '#757575', fontSize: '12px' }}>
              No results found.
            </div>
          )}
          {!isLoading && results.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => handleSelect(post)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 12px',
                background: post.id === value ? '#f0f0f0' : 'transparent',
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                fontSize: '12px',
                lineHeight: '1.4',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f6ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = post.id === value ? '#f0f0f0' : 'transparent'; }}
            >
              <span dangerouslySetInnerHTML={{ __html: post.title?.rendered || post.slug || `#${post.id}` }} />
              <span style={{ color: '#999', marginLeft: '6px' }}>#{post.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SelectedPostPreview({ postType, postId, onClear }) {
  const post = useSelect((select) => {
    if (!postId || !postType) return null;
    return select('core').getEntityRecord('postType', postType, postId);
  }, [postType, postId]);

  if (!postId) return null;

  const title = post ? (post.title?.rendered || post.slug || `#${postId}`) : null;
  const thumbnail = post ? (post.media_details?.sizes?.thumbnail?.source_url || post.source_url || '') : '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      background: 'rgba(0,0,0,0.04)',
      borderRadius: '4px',
      marginBottom: '8px',
    }}>
      {thumbnail && (
        <img src={thumbnail} alt=""
          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
        />
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        {title
          ? <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              dangerouslySetInnerHTML={{ __html: title }} />
          : <Spinner />
        }
        <div style={{ fontSize: '11px', color: '#757575' }}>{postType} #{postId}</div>
      </div>
      <Button isSmall variant="tertiary" onClick={onClear} style={{ flexShrink: 0 }}>
        Clear
      </Button>
    </div>
  );
}

/**
 * Renders the full source-post-override controls (type selector + search/media
 * picker + selected-post preview). No PanelBody wrapper - drop it inside
 * whatever panel section makes sense for the host block.
 *
 * Props:
 *   sourcePostType  - current value of the `sourcePostType` attribute
 *   sourcePostId    - current value of the `sourcePostId` attribute
 *   setAttributes   - block setAttributes
 */
export default function SourcePostControls({ sourcePostType, sourcePostId, setAttributes }) {
  const { options: postTypeOptions, restBaseBySlug } = usePostTypeOptions();
  const effectiveType = sourcePostType || 'post';

  return (
    <>
      <SelectControl
        label="Post Type"
        value={effectiveType}
        options={postTypeOptions}
        onChange={(val) => setAttributes({ sourcePostType: val, sourcePostId: 0 })}
      />

      {sourcePostId > 0 && (
        <SelectedPostPreview
          postType={effectiveType}
          postId={sourcePostId}
          onClear={() => setAttributes({ sourcePostId: 0 })}
        />
      )}

      {effectiveType === 'attachment' ? (
        <MediaUploadCheck>
          <MediaUpload
            onSelect={(media) => setAttributes({ sourcePostId: media?.id ? parseInt(media.id, 10) : 0 })}
            value={sourcePostId || 0}
            render={({ open }) => (
              <Button variant="secondary" onClick={open}>
                {sourcePostId > 0 ? 'Replace media' : 'Select media'}
              </Button>
            )}
          />
        </MediaUploadCheck>
      ) : (
        <PostSearchSelector
          postType={effectiveType}
          restBaseBySlug={restBaseBySlug}
          value={sourcePostId}
          onChange={(id) => setAttributes({ sourcePostId: id })}
        />
      )}
    </>
  );
}

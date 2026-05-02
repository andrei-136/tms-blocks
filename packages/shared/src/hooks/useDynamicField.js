import { useEffect, useMemo, useState } from 'react';
import apiFetch from '@wordpress/api-fetch';

const postMetaCache = new Map();
const termMetaCache = new Map();
let userMetaCache = null;
const previewCache = new Map();

const EMPTY_POST_META_OPTIONS = [{ label: 'Select meta key', value: '' }];

function parsePath(path) {
  if (!path || typeof path !== 'string') {
    return { taxonomies: [], hasAuthorStep: false };
  }

  const parts = path.split('.').filter(Boolean);
  const taxonomies = new Set();
  let hasAuthorStep = false;

  parts.forEach((part) => {
    const [type, value = ''] = String(part).split(':');
    if (type === 'terms' && value) {
      taxonomies.add(value);
    }
    if (type === 'author') {
      hasAuthorStep = true;
    }
  });

  return { taxonomies: Array.from(taxonomies), hasAuthorStep };
}

export default function useDynamicField({
  path = '',
  postId = 0,
  postType = 'post',
  dateFormat = '',
  commentsNoText = '',
  commentsOneText = '',
  commentsManyText = '',
}) {
  const [postMetaKeys, setPostMetaKeys] = useState([]);
  const [termMetaKeysByTax, setTermMetaKeysByTax] = useState({});
  const [userMetaKeys, setUserMetaKeys] = useState([]);
  const [previewValues, setPreviewValues] = useState([]);
  const [previewError, setPreviewError] = useState('');

  const { taxonomies, hasAuthorStep } = useMemo(() => parsePath(path), [path]);

  useEffect(() => {
    if (!postType) {
      setPostMetaKeys([]);
      return;
    }

    const cached = postMetaCache.get(postType);
    if (cached) {
      setPostMetaKeys(cached);
      return;
    }

    let active = true;
    apiFetch({ path: `/tmsblocks/v1/meta-keys?postType=${encodeURIComponent(postType)}` })
      .then((keys) => {
        if (!active) return;
        const next = Array.isArray(keys) ? keys : [];
        postMetaCache.set(postType, next);
        setPostMetaKeys(next);
      })
      .catch(() => {
        if (!active) return;
        setPostMetaKeys([]);
      });

    return () => {
      active = false;
    };
  }, [postType]);

  useEffect(() => {
    if (!taxonomies.length) {
      setTermMetaKeysByTax({});
      return;
    }

    let active = true;
    const uncached = taxonomies.filter((taxonomy) => !termMetaCache.has(taxonomy));

    if (!uncached.length) {
      const next = {};
      taxonomies.forEach((taxonomy) => {
        next[taxonomy] = termMetaCache.get(taxonomy) || [];
      });
      setTermMetaKeysByTax(next);
      return () => {
        active = false;
      };
    }

    Promise.all(
      uncached.map((taxonomy) =>
        apiFetch({ path: `/tmsblocks/v1/term-meta-keys?taxonomy=${encodeURIComponent(taxonomy)}` })
          .then((keys) => ({ taxonomy, keys: Array.isArray(keys) ? keys : [] }))
          .catch(() => ({ taxonomy, keys: [] }))
      )
    ).then((results) => {
      if (!active) return;
      results.forEach(({ taxonomy, keys }) => {
        termMetaCache.set(taxonomy, keys);
      });
      const next = {};
      taxonomies.forEach((taxonomy) => {
        next[taxonomy] = termMetaCache.get(taxonomy) || [];
      });
      setTermMetaKeysByTax(next);
    });

    return () => {
      active = false;
    };
  }, [taxonomies]);

  useEffect(() => {
    if (!hasAuthorStep) {
      setUserMetaKeys([]);
      return;
    }

    if (Array.isArray(userMetaCache)) {
      setUserMetaKeys(userMetaCache);
      return;
    }

    let active = true;
    apiFetch({ path: '/tmsblocks/v1/user-meta-keys' })
      .then((keys) => {
        if (!active) return;
        const next = Array.isArray(keys) ? keys : [];
        userMetaCache = next;
        setUserMetaKeys(next);
      })
      .catch(() => {
        if (!active) return;
        setUserMetaKeys([]);
      });

    return () => {
      active = false;
    };
  }, [hasAuthorStep]);

  useEffect(() => {
    if (!path || !postId) {
      setPreviewValues([]);
      setPreviewError('');
      return;
    }

    setPreviewError('');

    const cacheKey = `${postId}:${path}:${dateFormat}:${commentsNoText}:${commentsOneText}:${commentsManyText}`;
    const cached = previewCache.get(cacheKey);
    if (cached) {
      setPreviewValues(cached);
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      apiFetch({
        path: '/tmsblocks/v1/dynamic-field-preview',
        method: 'POST',
        data: { postId, path, dateFormat, commentsNoText, commentsOneText, commentsManyText },
      })
        .then((res) => {
          if (!active) return;
          const values = Array.isArray(res?.values) ? res.values : [];
          previewCache.set(cacheKey, values);
          setPreviewValues(values);
        })
        .catch(() => {
          if (!active) return;
          setPreviewError('Preview unavailable');
          setPreviewValues([]);
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [path, postId, dateFormat, commentsNoText, commentsOneText, commentsManyText]);

  const postMetaOptions = useMemo(() =>
    EMPTY_POST_META_OPTIONS.concat(postMetaKeys.map((key) => ({ label: key, value: key }))),
  [postMetaKeys]);

  const termMetaOptionsByTax = useMemo(() => {
    const map = {};
    Object.keys(termMetaKeysByTax).forEach((taxonomy) => {
      map[taxonomy] = [{ label: 'Select meta key', value: '' }].concat(
        (termMetaKeysByTax[taxonomy] || []).map((key) => ({ label: key, value: key }))
      );
    });
    return map;
  }, [termMetaKeysByTax]);

  const termMetaOptions = useMemo(() => {
    const list = [{ label: 'Select meta key', value: '' }];
    Object.entries(termMetaKeysByTax).forEach(([taxonomy, keys]) => {
      (keys || []).forEach((key) => {
        list.push({ label: `${taxonomy}: ${key}`, value: key });
      });
    });
    return list;
  }, [termMetaKeysByTax]);

  const userMetaOptions = useMemo(() =>
    [{ label: 'Select meta key', value: '' }].concat(userMetaKeys.map((key) => ({ label: key, value: key }))),
  [userMetaKeys]);

  const previewValue = useMemo(() => {
    if (!previewValues.length) return '';
    return String(previewValues[0] ?? '');
  }, [previewValues]);

  return {
    previewValue,
    previewValues,
    previewError,
    postMetaOptions,
    termMetaOptions,
    termMetaOptionsByTax,
    userMetaOptions,
  };
}

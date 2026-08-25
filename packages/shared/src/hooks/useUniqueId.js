import { useEffect, useRef } from 'react';
import { dispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { generateUniqueId } from '../utils';

// Module-level registry: uniqueId -> clientId (first registrant wins).
// Avoids subscribing every block instance to getClientIdsWithDescendants(),
// which is O(N x total_blocks) and causes re-render cascades in query loops.
const registry = new Map();


export default function useUniqueId({ uniqueId, clientId, setAttributes, attributeName = 'uniqueId' }) {
  const registeredId = useRef(null);

  useEffect(() => {
    // Clean up any previously registered entry for this instance.
    if (registeredId.current && registry.get(registeredId.current) === clientId) {
      registry.delete(registeredId.current);
      registeredId.current = null;
    }

    if (!uniqueId) {
      
      dispatch(blockEditorStore).updateBlockAttributes(clientId, {
        [attributeName]: generateUniqueId(),
      });
      return;
    }
    
    const existing = registry.get(uniqueId);
    if (existing && existing !== clientId) {
      dispatch(blockEditorStore).updateBlockAttributes(clientId, {
        [attributeName]: generateUniqueId(),
      });
      return;
    }

    
    registry.set(uniqueId, clientId);
    registeredId.current = uniqueId;
  }, [uniqueId, clientId, setAttributes, attributeName]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (registeredId.current && registry.get(registeredId.current) === clientId) {
       
        registry.delete(registeredId.current);
      }
    };
  }, [clientId]);
}

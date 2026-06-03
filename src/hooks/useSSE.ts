import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { updateDocumentStatuses } from '../store/folderSlice';
import { toastEmitter } from '../services/toastEmitter';
import { api } from '../services/api';

/**
 * App-level SSE hook.
 *
 * STREAMING:
 *   axios fires onDownloadProgress on every XHR progress event.
 *   In React Native, xhr.responseText accumulates the full stream.
 *   We track how much we've processed ('processed' counter) and parse
 *   only the new slice on each call. SSE events are split by '\n\n'.
 */
export function useSSE() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Stable ref so XHR/timeout callbacks always see the latest auth state
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);

  // Live ref for document title lookups — 'Failed' events never carry a title
  const documentsRef = useRef<RootState['folder']['documents']>([]);
  const documents = useSelector((state: RootState) => state.folder.documents);
  useEffect(() => { documentsRef.current = documents; }, [documents]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedRef = useRef(0);
  const bufferRef = useRef('');

  const processBlock = (block: string) => {
    let dataValue = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('data: ')) dataValue = line.slice(6);
    }
    if (!dataValue) return;

    let data: any;
    try { data = JSON.parse(dataValue); }
    catch (e) { return; }

    // Initial handshake — no UI action
    if (data.connected) return;

    // Patch status badge in Library without a full refetch
    if (data.documentId && data.aiStatus) {
      dispatch(updateDocumentStatuses([{ _id: data.documentId, aiStatus: data.aiStatus }]));
    }

    const docTitle =
      data.document?.title ??
      documentsRef.current.find((d) => d._id === data.documentId)?.title ??
      'Document';

    if (data.aiStatus === 'Analyzed') {
      toastEmitter.show(`"${docTitle}" is ready to explore!`, 'success');
    } else if (data.aiStatus === 'Failed') {
      toastEmitter.show(`Analysis failed for "${docTitle}"`, 'error');
    }
  };

  const handleChunk = (raw: string) => {
    if (!raw || raw.length <= processedRef.current) return;

    bufferRef.current += raw.substring(processedRef.current);
    processedRef.current = raw.length;

    const parts = bufferRef.current.split('\n\n');
    bufferRef.current = parts.pop() ?? '';

    for (const block of parts) {
      if (block.trim()) processBlock(block);
    }
  };

  const connect = () => {
    if (abortControllerRef.current) return; // already open

    const controller = new AbortController();
    abortControllerRef.current = controller;
    processedRef.current = 0;
    bufferRef.current = '';

    api.get('/documents/status/stream', {
      responseType: 'text',
      timeout: 0,
      signal: controller.signal,
      headers: { Accept: 'text/event-stream' },
      onDownloadProgress: (progressEvent: any) => {
        const raw: string =
          progressEvent?.event?.target?.responseText ??
          progressEvent?.event?.target?.response ??
          progressEvent?.currentTarget?.responseText ??
          '';
        handleChunk(raw);
      },
    })
      .then(() => {
        abortControllerRef.current = null;
        if (isAuthenticatedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 5_000);
        }
      })
      .catch((err: any) => {
        abortControllerRef.current = null;
        if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
          return;
        }
        if (isAuthenticatedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 5_000);
        }
      });
  };

  const cleanup = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { cleanup(); return; }
    connect();
    return cleanup;
  }, [isAuthenticated]);
}

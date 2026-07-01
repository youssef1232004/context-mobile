import { useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { documentService } from '../features/documents/api/documentService';
import { useNotifications } from './useNotifications';

export const START_POLLING_EVENT = 'START_DOCUMENT_POLLING';

export const useDocumentAnalysisPoller = () => {
  const { notifyAnalysisReady, notifyAnalysisFailed } = useNotifications();
  // Map of documentId -> { name }
  const pollingQueue = useRef<Map<string, { name: string }>>(new Map());
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Listen for new documents to poll
    const sub = DeviceEventEmitter.addListener(START_POLLING_EVENT, ({ id, name }: { id: string; name: string }) => {
      pollingQueue.current.set(id, { name });
    });

    // Start polling every 10 seconds
    timerRef.current = setInterval(async () => {
      if (pollingQueue.current.size === 0) return;

      const ids = Array.from(pollingQueue.current.keys());
      try {
        const response = await documentService.getStatus(ids);
        if (response.success && response.data) {
          response.data.forEach((doc: any) => {
            const { _id, aiStatus, title } = doc;
            const docInfo = pollingQueue.current.get(_id);
            if (!docInfo) return;

            // Trigger notification based on status
            if (aiStatus === 'Analyzed') {
              notifyAnalysisReady(title || docInfo.name, _id);
              pollingQueue.current.delete(_id);
            } else if (aiStatus === 'Failed') {
              notifyAnalysisFailed(title || docInfo.name, _id);
              pollingQueue.current.delete(_id);
            }
          });
        }
      } catch (err) {
        console.log('Polling error:', err);
      }
    }, 10000); // 10 seconds

    return () => {
      sub.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [notifyAnalysisReady, notifyAnalysisFailed]);
};

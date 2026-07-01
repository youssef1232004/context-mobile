import { useState, useRef, useCallback } from 'react';
import { api } from '../services/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'ai';
  content: string;
}

export function useChatSSE(endpoint: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const processedRef = useRef(0);
  const bufferRef = useRef('');

  const appendUserMessage = useCallback((msg: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setInitialMessages = useCallback((initialMessages: ChatMessage[]) => {
    setMessages(initialMessages);
  }, []);

  const sendMessage = useCallback(async (msg: string) => {
    if (!msg.trim() || loading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // Add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    
    // Create an empty assistant message that we will stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    setLoading(true);

    processedRef.current = 0;
    bufferRef.current = '';

    try {
      await api.post(
        endpoint,
        { message: msg },
        {
          responseType: 'text',
          signal: controller.signal,
          headers: { Accept: 'text/event-stream' },
          onDownloadProgress: (progressEvent: any) => {
            const raw: string =
              progressEvent?.event?.target?.responseText ??
              progressEvent?.event?.target?.response ??
              progressEvent?.currentTarget?.responseText ??
              '';

            if (!raw || raw.length <= processedRef.current) return;

            bufferRef.current += raw.substring(processedRef.current);
            processedRef.current = raw.length;

            const parts = bufferRef.current.split('\n\n');
            bufferRef.current = parts.pop() ?? ''; // Keep the last incomplete chunk in the buffer

            for (const block of parts) {
              if (!block.trim()) continue;
              
              if (block.includes('[DONE]')) {
                break;
              }

              let dataValue = '';
              for (const line of block.split('\n')) {
                if (line.startsWith('data: ')) {
                  dataValue = line.slice(6);
                }
              }

              if (!dataValue) continue;

              try {
                const parsed = JSON.parse(dataValue);
                if (parsed.error) {
                  // Handle backend streaming error
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                      newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        content: newMessages[lastIndex].content + '\n\n**Error:** ' + parsed.error,
                      };
                    }
                    return newMessages;
                  });
                  break;
                }
                
                if (parsed.content) {
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                      newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        content: newMessages[lastIndex].content + parsed.content,
                      };
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                // If it's not valid JSON, ignore
              }
            }
          },
        }
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError' && err?.code !== 'ERR_CANCELED') {
        // Only show error if it wasn't manually cancelled
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
            const currentContent = newMessages[lastIndex].content;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: currentContent ? currentContent : 'Failed to get response. Please try again.',
            };
          }
          return newMessages;
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [endpoint, loading]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    setInitialMessages,
    clearMessages,
    appendUserMessage,
    abort,
  };
}

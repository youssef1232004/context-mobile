import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { generateCacheKey, hydrateFolderCache } from '../features/folders/store/folderSlice';
import { AppDispatch } from '../store/store';

const ASYNC_CACHE_PREFIX = '@library_cache_';

export function useLibraryCache(params: { folderId?: string; search?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
  const dispatch = useDispatch<AppDispatch>();
  const isMounted = useRef(true);
  const [isCacheLoading, setIsCacheLoading] = useState(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // Only attempt to load cache on page 1
    if (params.page && params.page > 1) {
      setIsCacheLoading(false);
      return;
    }

    const loadPersistentCache = async () => {
      try {
        const cacheKey = generateCacheKey(params);
        const asyncKey = `${ASYNC_CACHE_PREFIX}${cacheKey}`;
        const cachedStr = await AsyncStorage.getItem(asyncKey);
        
        if (cachedStr && isMounted.current) {
          const data = JSON.parse(cachedStr);
          dispatch(hydrateFolderCache({ cacheKey, data }));
        }
      } catch (err) {
        console.error('Failed to load library persistent cache:', err);
      } finally {
        if (isMounted.current) setIsCacheLoading(false);
      }
    };

    setIsCacheLoading(true);
    loadPersistentCache();
  }, [params.folderId, params.search, params.sortBy, params.sortOrder, dispatch]);

  return { isCacheLoading };
}

// Function to save cache (to be called by fetchFolderContents extraReducer or locally)
export const savePersistentLibraryCache = async (params: any, data: any) => {
  try {
    const cacheKey = generateCacheKey(params);
    const asyncKey = `${ASYNC_CACHE_PREFIX}${cacheKey}`;
    await AsyncStorage.setItem(asyncKey, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save library persistent cache:', e);
  }
};


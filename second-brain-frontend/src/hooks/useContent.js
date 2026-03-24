import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setContentLoading, setContentError, setContentData, addContentItem, removeContentItem } from '../redux/slices/contentSlice';
import { getContentApi, saveContentApi, deleteContentApi } from '../api/content.api';

export const useGetContent = () => {
  const dispatch = useDispatch();

  const getContent = async () => {
    dispatch(setContentLoading(true));
    try {
      const response = await getContentApi();
      const payload = response.data !== undefined ? response.data : response;
      dispatch(setContentData(payload || []));
      return { success: true, data: payload };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch content';
      dispatch(setContentError(message));
      return { success: false, error: message };
    }
  };

  return { getContent };
};

export const useSaveContent = () => {
  const dispatch = useDispatch();

  const saveContent = async (contentData) => {
    dispatch(setContentLoading(true));
    try {
      const response = await saveContentApi(contentData);
      const payload = response.data !== undefined ? response.data : response;
      if (payload) {
        dispatch(addContentItem(payload));
      }
      return { success: true, data: payload };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save content';
      dispatch(setContentError(message));
      return { success: false, error: message };
    }
  };

  return { saveContent };
};

export const useDeleteContent = () => {
  const dispatch = useDispatch();

  const deleteContent = async (id) => {
    dispatch(setContentLoading(true));
    try {
      await deleteContentApi(id);
      dispatch(removeContentItem(id));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete content';
      dispatch(setContentError(message));
      return { success: false, error: message };
    }
  };

  return { deleteContent };
};

/**
 * REASONING FOR `useFilteredContent`:
 * 
 * 1. CLEAN ARCHITECTURE: The original content fetched from the API stays isolated inside Redux (`items`). 
 *    We do NOT put filtered data into Redux, because filtering is purely a UI concern.
 * 2. PERFORMANCE (DEBOUNCE): We use a 300ms debounce on the `searchTerm`. Instead of re-evaluating 
 *    the expensive `useMemo` filter loop on every single keystroke, it waits until the user 
 *    pauses typing. This dramatically improves UX and frontend performance for large arrays.
 * 3. NO API OVERHEAD: Filtering happens strictly on the frontend instead of re-fetching from the server.
 */
export const useFilteredContent = (content, searchTerm, selectedTag) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredContent = useMemo(() => {
    if (!content) return [];
    
    return content.filter((item) => {
      const matchSearch = 
        !debouncedSearch || 
        item.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        item.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
        
      const matchTag = 
        !selectedTag || 
        selectedTag === 'All' || 
        item.type === selectedTag || 
        (item.tags && item.tags.includes(selectedTag));
        
      return matchSearch && matchTag;
    });
  }, [content, debouncedSearch, selectedTag]);

  return { filteredContent };
};

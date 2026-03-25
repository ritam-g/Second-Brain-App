import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setContentLoading, setContentError, setContentData, addContentItem, removeContentItem } from '../redux/slices/contentSlice';
import { getContentApi, saveContentApi, deleteContentApi, uploadContentApi } from '../api/content.api';
import { getApiErrorMessage } from '../lib/api-error';
import { notify } from '../lib/toast';

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
      const message = getApiErrorMessage(err, 'Failed to fetch content');
      dispatch(setContentError(message));
      return { success: false, error: message };
    }
  };

  return { getContent };
};

export const useSaveContent = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const saveContent = async (contentData) => {
    setLoading(true);
    dispatch(setContentLoading(true));
    try {
      const response = await notify.promise(
        saveContentApi(contentData),
        {
          pending: 'Saving link to your library...',
          success: () => 'Content saved successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to save content'),
        },
        { toastId: 'save-content-request' },
      );
      const payload = response.data !== undefined ? response.data : response;
      if (payload) {
        dispatch(addContentItem(payload));
      }
      return { success: true, data: payload };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to save content');
      dispatch(setContentError(message));
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { saveContent, loading };
};

export const useDeleteContent = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const deleteContent = async (id) => {
    setLoading(true);
    dispatch(setContentLoading(true));
    try {
      await notify.promise(
        deleteContentApi(id),
        {
          pending: 'Removing content...',
          success: (result) => result?.message || 'Content deleted successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to delete content'),
        },
        { toastId: `delete-content-${id}` },
      );
      dispatch(removeContentItem(id));
      return { success: true };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to delete content');
      dispatch(setContentError(message));
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { deleteContent, loading };
};

export const useUploadContent = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const upload = async (formData) => {
    setLoading(true);
    dispatch(setContentLoading(true));
    try {
      const response = await notify.promise(
        uploadContentApi(formData),
        {
          pending: 'Uploading file to your library...',
          success: () => 'File uploaded successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to upload file'),
        },
        { toastId: 'upload-content-request' },
      );
      const payload = response.data !== undefined ? response.data : response;
      if (payload) {
        dispatch(addContentItem(payload));
      }
      return { success: true, data: payload };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to upload file');
      dispatch(setContentError(message));
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading };
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
 * 4. MULTI-FILTER SUPPORT: The dashboard needs search, category, and tag filtering together, so the
 *    hook accepts a structured filter object and keeps the combinational logic out of the page component.
 */
export const useFilteredContent = (content, filters = {}) => {
  const { searchTerm = '', selectedTag = 'All', selectedCategory = 'All' } = filters;
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
      const normalizedSearch = debouncedSearch.trim().toLowerCase();
      const normalizedTitle = String(item.title || '').toLowerCase();
      const normalizedTag = String(selectedTag || 'All');
      const normalizedCategory = String(selectedCategory || 'All');

      const matchSearch =
        !normalizedSearch
        || normalizedTitle.includes(normalizedSearch);

      const matchTag =
        !normalizedTag
        || normalizedTag === 'All'
        || item.type === normalizedTag
        || (item.tags && item.tags.includes(normalizedTag));

      const matchCategory =
        !normalizedCategory
        || normalizedCategory === 'All'
        || resolveDashboardCategory(item) === normalizedCategory;

      return matchSearch && matchTag && matchCategory;
    });
  }, [content, debouncedSearch, selectedTag, selectedCategory]);

  return { filteredContent };
};

function resolveDashboardCategory(item) {
  const normalizedType = String(item?.type || '').toLowerCase();
  const normalizedUrl = String(item?.url || '').toLowerCase();

  if (normalizedType === 'youtube' || normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    return 'Video';
  }

  if (
    ['tweet', 'x', 'linkedin', 'instagram'].includes(normalizedType)
    || normalizedUrl.includes('twitter.com')
    || normalizedUrl.includes('x.com')
    || normalizedUrl.includes('linkedin.com')
    || normalizedUrl.includes('instagram.com')
  ) {
    return 'Social';
  }

  return 'Links';
}

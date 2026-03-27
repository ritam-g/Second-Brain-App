import { useState, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setContentLoading, setContentError, setContentData, addContentItem, removeContentItem, clearContentState } from '../redux/slices/contentSlice';
import { getContentApi, saveContentApi, deleteContentApi, uploadContentApi, semanticSearchContentApi, clearAllContentApi } from '../api/content.api';
import { getApiErrorMessage } from '../utils/api-error';
import { notify } from '../utils/toast';

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
          success: (result) => result?.message || 'Content saved successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to save content'),
        },
        { toastId: 'save-content-request' },
      );
      const result = response && typeof response === 'object' ? response : { data: response };
      const payload = result.data !== undefined ? result.data : result;

      if (result?.duplicate) {
        dispatch(setContentLoading(false));
      } else if (payload) {
        dispatch(addContentItem(payload));
      } else {
        dispatch(setContentLoading(false));
      }
      return { success: true, data: payload, duplicate: Boolean(result?.duplicate), message: result?.message || '' };
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
          success: (result) => result?.message || 'File uploaded successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to upload file'),
        },
        { toastId: 'upload-content-request' },
      );
      const result = response && typeof response === 'object' ? response : { data: response };
      const payload = result.data !== undefined ? result.data : result;

      if (result?.duplicate) {
        dispatch(setContentLoading(false));
      } else if (payload) {
        dispatch(addContentItem(payload));
      } else {
        dispatch(setContentLoading(false));
      }
      return { success: true, data: payload, duplicate: Boolean(result?.duplicate), message: result?.message || '' };
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

export const useClearAllContent = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const clearAllContent = async () => {
    setLoading(true);
    dispatch(setContentLoading(true));
    try {
      const response = await notify.promise(
        clearAllContentApi(),
        {
          pending: 'Clearing your archive...',
          success: (result) => result?.message || 'Archive cleared successfully.',
          error: (error) => getApiErrorMessage(error, 'Failed to clear content'),
        },
        { toastId: 'clear-all-content-request' },
      );

      dispatch(clearContentState());
      return { success: true, data: response?.data || null };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to clear content');
      dispatch(setContentError(message));
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { clearAllContent, loading };
};

export const useSemanticSearchContent = () => {
  const [loading, setLoading] = useState(false);

  const searchContent = useCallback(async (payload) => {
    setLoading(true);

    try {
      // Semantic search is tied to the dashboard search box, so we avoid toast spam while users type.
      const response = await semanticSearchContentApi(payload);

      const results = response.data !== undefined ? response.data : response;
      return { success: true, data: results || [] };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to search content');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchContent, loading };
};

// Keeps category and tag filtering local for archive browsing.
// Text search is intentionally excluded because semantic search now happens through the backend API.
export const useFilteredContent = (content, filters = {}) => {
  const { selectedTag = 'All', selectedCategory = 'All' } = filters;

  const filteredContent = useMemo(() => {
    if (!Array.isArray(content) || !content.length) {
      return [];
    }

    const normalizedTag = String(selectedTag || 'All');
    const normalizedCategory = String(selectedCategory || 'All');
    const results = [];

    for (const item of content) {
      const matchTag =
        !normalizedTag
        || normalizedTag === 'All'
        || item.type === normalizedTag
        || (item.tags && item.tags.includes(normalizedTag));

      const matchCategory =
        !normalizedCategory
        || normalizedCategory === 'All'
        || resolveDashboardCategory(item) === normalizedCategory;

      if (matchTag && matchCategory) {
        results.push(item);
      }
    }

    return results;
  }, [content, selectedTag, selectedCategory]);

  return { filteredContent };
};

function resolveDashboardCategory(item) {
  const normalizedType = String(item?.type || '').toLowerCase();
  const normalizedUrl = String(item?.url || '').toLowerCase();

  if (normalizedType === 'pdf' || normalizedType === 'document' || normalizedUrl.includes('.pdf')) {
    return 'Documents';
  }

  if (normalizedType === 'image' || /\.(png|jpe?g|webp|gif|bmp|svg)(?:$|[?#])/i.test(normalizedUrl)) {
    return 'Images';
  }

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

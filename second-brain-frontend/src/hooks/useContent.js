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

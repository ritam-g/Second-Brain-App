import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeContentViewer, openContentViewer } from '../redux/slices/contentSlice';

export function useContentViewer() {
  const dispatch = useDispatch();
  const { selectedItem, isViewerOpen } = useSelector((state) => state.content);

  const openViewer = useCallback((item) => {
    dispatch(openContentViewer(item));
  }, [dispatch]);

  const closeViewer = useCallback(() => {
    dispatch(closeContentViewer());
  }, [dispatch]);

  return {
    selectedContent: selectedItem,
    isViewerOpen,
    openViewer,
    closeViewer,
  };
}

export function useContentViewerActions() {
  const dispatch = useDispatch();

  const openViewer = useCallback((item) => {
    dispatch(openContentViewer(item));
  }, [dispatch]);

  const closeViewer = useCallback(() => {
    dispatch(closeContentViewer());
  }, [dispatch]);

  return {
    openViewer,
    closeViewer,
  };
}

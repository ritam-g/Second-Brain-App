import { useCallback, useState } from 'react';
import { getStoredUserPreferences, saveUserPreferences } from '../utils/userPreferences';

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(() => getStoredUserPreferences());

  const updatePreferences = useCallback((updates) => {
    setPreferences((currentPreferences) => saveUserPreferences({
      ...currentPreferences,
      ...(typeof updates === 'function' ? updates(currentPreferences) : updates),
    }));
  }, []);

  const setDefaultLandingRoute = useCallback((route) => {
    updatePreferences({ defaultLandingRoute: route });
  }, [updatePreferences]);

  const setReduceMotion = useCallback((value) => {
    updatePreferences({ reduceMotion: Boolean(value) });
  }, [updatePreferences]);

  return {
    preferences,
    updatePreferences,
    setDefaultLandingRoute,
    setReduceMotion,
  };
};

export default useUserPreferences;

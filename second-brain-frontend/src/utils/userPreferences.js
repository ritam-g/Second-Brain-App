export const landingRouteOptions = [
  { value: '/dashboard', label: 'Library', description: 'Start in your saved archive.' },
  { value: '/graph', label: 'Graph', description: 'Open the relationship map first.' },
  { value: '/deep-focus', label: 'Deep Focus', description: 'Jump directly into AI chat.' },
];

const STORAGE_KEY = 'second-brain:user-preferences';

const defaultPreferences = {
  defaultLandingRoute: '/dashboard',
  reduceMotion: false,
  theme: 'obsidian-dark',
};

export function getStoredUserPreferences() {
  if (typeof window === 'undefined') {
    return { ...defaultPreferences };
  }

  try {
    const rawPreferences = window.localStorage.getItem(STORAGE_KEY);

    if (!rawPreferences) {
      return { ...defaultPreferences };
    }

    return normalizeUserPreferences(JSON.parse(rawPreferences));
  } catch {
    return { ...defaultPreferences };
  }
}

export function saveUserPreferences(preferences) {
  const normalizedPreferences = normalizeUserPreferences(preferences);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedPreferences));
  }

  applyUserPreferenceEffects(normalizedPreferences);
  return normalizedPreferences;
}

export function applyStoredUserPreferences() {
  const preferences = getStoredUserPreferences();
  applyUserPreferenceEffects(preferences);
  return preferences;
}

export function getPreferredLandingRoute() {
  return getStoredUserPreferences().defaultLandingRoute;
}

export function applyUserPreferenceEffects(preferences) {
  if (typeof document === 'undefined') {
    return;
  }

  const normalizedPreferences = normalizeUserPreferences(preferences);
  document.documentElement.dataset.reduceMotion = normalizedPreferences.reduceMotion ? 'true' : 'false';
  document.documentElement.dataset.theme = normalizedPreferences.theme;
}

function normalizeUserPreferences(preferences = {}) {
  const nextLandingRoute = landingRouteOptions.some((option) => option.value === preferences?.defaultLandingRoute)
    ? preferences.defaultLandingRoute
    : defaultPreferences.defaultLandingRoute;

  return {
    defaultLandingRoute: nextLandingRoute,
    reduceMotion: Boolean(preferences?.reduceMotion),
    theme: defaultPreferences.theme,
  };
}

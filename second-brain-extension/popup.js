const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:5173';
const RENDER_API_BASE_URL = 'https://second-brain-app.onrender.com/api';
const AUTH_COOKIE_NAME = 'jwtToken';
const SAVE_ENDPOINT = '/content/save';
const AUTH_CHECK_ENDPOINT = '/auth/me';
const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';
const STORAGE_KEYS = {
  apiBaseUrl: 'apiBaseUrl',
  authToken: 'authToken',
};

const saveButton = document.getElementById('saveButton');
const statusText = document.getElementById('status');

let popupSessionState = {
  ready: false,
  networkError: false,
  apiBaseUrl: DEFAULT_API_BASE_URL,
};

const initializationPromise = initializePopup();

saveButton.addEventListener('click', handleSaveClick);

async function initializePopup() {
  try {
    const sessionState = await syncStoredSessionFromCookie();
    popupSessionState = sessionState;

    if (sessionState.ready) {
      setStatus('idle', 'Ready to save this page.');
      return;
    }

    if (sessionState.networkError) {
      setStatus('error', 'Unable to reach the server. Check your connection and try again.');
      return;
    }

    setStatus('error', 'Please login first');
  } catch {
    popupSessionState = {
      ready: false,
      networkError: true,
      apiBaseUrl: DEFAULT_API_BASE_URL,
    };
    setStatus('error', 'Unable to reach the server. Check your connection and try again.');
  }
}

async function handleSaveClick() {
  setLoadingState(true);
  setStatus('loading', 'Saving...');

  try {
    await initializationPromise;

    const session = await getStoredSession();

    if (!popupSessionState.ready && popupSessionState.networkError) {
      throw new Error('Unable to reach the server. Check your connection and try again.');
    }

    if (!session.token) {
      setStatus('error', 'Please login first');
      await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), LOGIN_ROUTE);
      return;
    }

    const activeTab = await getActiveTab();

    if (!activeTab?.id || !isSupportedPage(activeTab.url)) {
      throw new Error('Open a normal website page before saving it.');
    }

    const pageData = await extractPageData(activeTab);
    const result = await savePage(session.apiBaseUrl, session.token, pageData);

    setStatus('success', 'Saved! Opening dashboard...');
    await wait(300);
    await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), DASHBOARD_ROUTE);
    popupSessionState = { ...popupSessionState, ready: true };
    return result;
  } catch (error) {
    if (error?.code === 'UNAUTHORIZED') {
      await clearStoredToken();
      popupSessionState = {
        ready: false,
        networkError: false,
        apiBaseUrl: error.apiBaseUrl || popupSessionState.apiBaseUrl || DEFAULT_API_BASE_URL,
      };
      setStatus('error', 'Please login first');
      await openOrFocusFrontendPage(resolveFrontendBaseUrl(popupSessionState.apiBaseUrl), LOGIN_ROUTE);
      return;
    }

    setStatus('error', mapErrorToMessage(error));
  } finally {
    setLoadingState(false);
  }
}

async function syncStoredSessionFromCookie() {
  const storedSession = await getStoredSession();
  const cookieCandidates = await chrome.cookies.getAll({ name: AUTH_COOKIE_NAME });
  let hadRetryableError = false;

  for (const cookie of cookieCandidates) {
    const token = String(cookie?.value || '').trim();

    if (!token) {
      continue;
    }

    const apiBaseUrlCandidates = getApiBaseUrlCandidates(cookie, storedSession.apiBaseUrl);

    for (const apiBaseUrl of apiBaseUrlCandidates) {
      const authStatus = await checkAuthStatus(apiBaseUrl, token);

      if (authStatus.success) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.apiBaseUrl]: apiBaseUrl,
          [STORAGE_KEYS.authToken]: token,
        });

        return {
          ready: true,
          networkError: false,
          apiBaseUrl,
        };
      }

      if (authStatus.retryableError) {
        hadRetryableError = true;
      }
    }
  }

  if (!hadRetryableError) {
    await clearStoredToken();
  }

  return {
    ready: false,
    networkError: hadRetryableError,
    apiBaseUrl: storedSession.apiBaseUrl,
  };
}

async function getStoredSession() {
  const storedSession = await chrome.storage.local.get([STORAGE_KEYS.apiBaseUrl, STORAGE_KEYS.authToken]);

  return {
    apiBaseUrl: normalizeApiBaseUrl(storedSession[STORAGE_KEYS.apiBaseUrl]) || DEFAULT_API_BASE_URL,
    token: String(storedSession[STORAGE_KEYS.authToken] || '').trim(),
  };
}

async function clearStoredToken() {
  await chrome.storage.local.remove(STORAGE_KEYS.authToken);
}

function getApiBaseUrlCandidates(cookie, storedApiBaseUrl) {
  const candidates = [
    normalizeApiBaseUrl(storedApiBaseUrl),
    DEFAULT_API_BASE_URL,
    RENDER_API_BASE_URL,
  ];
  const derivedApiBaseUrl = buildApiBaseUrlFromCookie(cookie);

  if (derivedApiBaseUrl) {
    candidates.push(derivedApiBaseUrl);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function buildApiBaseUrlFromCookie(cookie) {
  const domain = String(cookie?.domain || '').replace(/^\./, '').trim();

  if (!domain) {
    return '';
  }

  const protocol = cookie.secure ? 'https' : 'http';
  return `${protocol}://${domain}/api`;
}

async function checkAuthStatus(apiBaseUrl, token) {
  if (!apiBaseUrl || !token) {
    return { success: false, retryableError: false };
  }

  try {
    const response = await fetch(`${apiBaseUrl}${AUTH_CHECK_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = await parseJsonSafe(response);

    if (response.status === 401) {
      return { success: false, retryableError: false };
    }

    if (!response.ok) {
      return { success: false, retryableError: true, message: getResponseMessage(payload, 'Unable to verify your session.') };
    }

    if (!payload || typeof payload !== 'object' || payload.success !== true || !payload.data?.user) {
      return { success: false, retryableError: true, message: 'The server returned an invalid response.' };
    }

    return { success: true, retryableError: false };
  } catch {
    return { success: false, retryableError: true, message: 'Unable to reach the server. Check your connection and try again.' };
  }
}

async function savePage(apiBaseUrl, token, pageData) {
  const response = await fetch(`${apiBaseUrl}${SAVE_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: pageData.url,
      title: pageData.title,
      description: pageData.description,
      image: pageData.image,
    }),
  });
  const payload = await parseJsonSafe(response);

  if (response.status === 401) {
    throw createUnauthorizedError(getResponseMessage(payload, 'Please login first'), apiBaseUrl);
  }

  if (!response.ok) {
    throw new Error(getResponseMessage(payload, 'Failed to save'));
  }

  if (!payload || typeof payload !== 'object' || payload.success !== true) {
    throw createInvalidResponseError();
  }

  return payload;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

async function extractPageData(tab) {
  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: collectPageMetadata,
    args: [tab.title || '', tab.url || ''],
  });

  if (!result) {
    throw new Error('Unable to read this page. Try a different tab.');
  }

  return {
    url: result.url || tab.url || '',
    title: result.title || tab.title || '',
    description: result.description || '',
    image: result.image || '',
  };
}

function collectPageMetadata(fallbackTitle, fallbackUrl) {
  const getMetaContent = (selector) => {
    const element = document.querySelector(selector);
    return element?.getAttribute('content')?.trim() || '';
  };

  return {
    url: window.location.href || fallbackUrl || '',
    title: document.title || fallbackTitle || '',
    description:
      getMetaContent('meta[property="og:description"]')
      || getMetaContent('meta[name="og:description"]')
      || getMetaContent('meta[name="description"]')
      || '',
    image:
      getMetaContent('meta[property="og:image"]')
      || getMetaContent('meta[name="og:image"]')
      || '',
  };
}

async function openOrFocusFrontendPage(frontendBaseUrl, routePath) {
  const targetUrl = buildFrontendUrl(frontendBaseUrl, routePath);
  const tabs = await chrome.tabs.query({});
  const existingTab = tabs.find((tab) => isSameRoute(tab.url, targetUrl));

  if (!existingTab?.id) {
    await chrome.tabs.create({ url: targetUrl });
    return;
  }

  const tabUpdate = isSameUrl(existingTab.url, targetUrl)
    ? { active: true }
    : { active: true, url: targetUrl };

  await chrome.tabs.update(existingTab.id, tabUpdate);

  if (typeof existingTab.windowId === 'number') {
    try {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    } catch {
      // Focusing the tab is enough when the window API is unavailable.
    }
  }
}

function resolveFrontendBaseUrl(apiBaseUrl) {
  const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl) || DEFAULT_API_BASE_URL;

  try {
    const parsedApiUrl = new URL(normalizedApiBaseUrl);

    if (parsedApiUrl.hostname === 'localhost' && parsedApiUrl.port === '3000') {
      return DEFAULT_FRONTEND_BASE_URL;
    }

    parsedApiUrl.pathname = '';
    parsedApiUrl.search = '';
    parsedApiUrl.hash = '';

    return parsedApiUrl.toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_FRONTEND_BASE_URL;
  }
}

function buildFrontendUrl(frontendBaseUrl, routePath) {
  return new URL(routePath, `${String(frontendBaseUrl || '').replace(/\/+$/, '')}/`).toString();
}

function isSameRoute(currentUrl, targetUrl) {
  try {
    const parsedCurrentUrl = new URL(currentUrl);
    const parsedTargetUrl = new URL(targetUrl);

    return parsedCurrentUrl.origin === parsedTargetUrl.origin
      && normalizePathname(parsedCurrentUrl.pathname) === normalizePathname(parsedTargetUrl.pathname);
  } catch {
    return false;
  }
}

function isSameUrl(currentUrl, targetUrl) {
  return String(currentUrl || '').replace(/\/+$/, '') === String(targetUrl || '').replace(/\/+$/, '');
}

function normalizePathname(pathname) {
  const normalizedPathname = String(pathname || '').trim().replace(/\/+$/, '');
  return normalizedPathname || '/';
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getResponseMessage(payload, fallbackMessage) {
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallbackMessage;
}

function normalizeApiBaseUrl(value) {
  const normalizedValue = String(value || '').trim().replace(/\/+$/, '');
  return normalizedValue || '';
}

function isSupportedPage(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function setLoadingState(isLoading) {
  saveButton.disabled = isLoading;
  saveButton.textContent = isLoading ? 'Saving...' : 'Save Page';
}

function setStatus(state, message) {
  statusText.dataset.state = state;
  statusText.textContent = message;
}

function createUnauthorizedError(message, apiBaseUrl) {
  const error = new Error(message);
  error.code = 'UNAUTHORIZED';
  error.apiBaseUrl = apiBaseUrl;
  return error;
}

function createInvalidResponseError() {
  const error = new Error('The server returned an invalid response.');
  error.code = 'INVALID_RESPONSE';
  return error;
}

function mapErrorToMessage(error) {
  if (error?.code === 'UNAUTHORIZED') {
    return 'Please login first';
  }

  if (error?.code === 'INVALID_RESPONSE') {
    return 'Failed to save';
  }

  if (error instanceof TypeError) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return 'Failed to save';
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

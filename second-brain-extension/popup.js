const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';
const RENDER_API_BASE_URL = 'https://second-brain-app.onrender.com/api';
const AUTH_COOKIE_NAME = 'jwtToken';
const STORAGE_KEYS = {
  apiBaseUrl: 'apiBaseUrl',
  authToken: 'authToken',
};
const SAVE_ENDPOINT = '/content/save';
const AUTH_CHECK_ENDPOINT = '/auth/me';

const saveButton = document.getElementById('saveButton');
const statusText = document.getElementById('status');

saveButton.addEventListener('click', handleSaveClick);

async function handleSaveClick() {
  setLoadingState(true);
  setStatus('loading', 'Saving page...');

  try {
    const activeTab = await getActiveTab();

    if (!activeTab?.id || !isSupportedPage(activeTab.url)) {
      throw new Error('Open a normal website page before saving it.');
    }

    const pageData = await extractPageData(activeTab);
    const session = await resolveApiSession();

    if (!session.token) {
      throw createUnauthorizedError('Please sign in to Second Brain first.');
    }

    const result = await savePage(session.apiBaseUrl, session.token, pageData);
    setStatus('success', getResponseMessage(result, 'Page saved successfully.'));
  } catch (error) {
    setStatus('error', mapErrorToMessage(error));
  } finally {
    setLoadingState(false);
  }
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

async function resolveApiSession() {
  const storedSession = await chrome.storage.local.get([STORAGE_KEYS.apiBaseUrl, STORAGE_KEYS.authToken]);
  const storedApiBaseUrl = normalizeApiBaseUrl(storedSession[STORAGE_KEYS.apiBaseUrl]);
  const storedToken = String(storedSession[STORAGE_KEYS.authToken] || '').trim();

  if (storedApiBaseUrl && storedToken) {
    const isStoredSessionValid = await validateSession(storedApiBaseUrl, storedToken);

    if (isStoredSessionValid) {
      return { apiBaseUrl: storedApiBaseUrl, token: storedToken };
    }
  }

  const cookieCandidates = await chrome.cookies.getAll({ name: AUTH_COOKIE_NAME });

  for (const cookie of cookieCandidates) {
    const token = String(cookie?.value || '').trim();

    if (!token) {
      continue;
    }

    const apiBaseUrlCandidates = getApiBaseUrlCandidates(cookie, storedApiBaseUrl);

    for (const apiBaseUrl of apiBaseUrlCandidates) {
      const isValid = await validateSession(apiBaseUrl, token);

      if (!isValid) {
        continue;
      }

      await chrome.storage.local.set({
        [STORAGE_KEYS.apiBaseUrl]: apiBaseUrl,
        [STORAGE_KEYS.authToken]: token,
      });

      return { apiBaseUrl, token };
    }
  }

  return {
    apiBaseUrl: storedApiBaseUrl || DEFAULT_API_BASE_URL,
    token: storedToken,
  };
}

function getApiBaseUrlCandidates(cookie, storedApiBaseUrl) {
  const candidates = [
    storedApiBaseUrl,
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

async function validateSession(apiBaseUrl, token) {
  if (!apiBaseUrl || !token) {
    return false;
  }

  try {
    const response = await fetch(`${apiBaseUrl}${AUTH_CHECK_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = await parseJsonSafe(response);
    return Boolean(payload?.success && payload?.data?.user);
  } catch {
    return false;
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
    await chrome.storage.local.remove(STORAGE_KEYS.authToken);
    throw createUnauthorizedError(getResponseMessage(payload, 'Please sign in to Second Brain again.'));
  }

  if (!response.ok) {
    throw new Error(getResponseMessage(payload, 'Failed to save page.'));
  }

  if (!payload || typeof payload !== 'object' || payload.success !== true) {
    throw new Error('The server returned an invalid response.');
  }

  return payload;
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

function createUnauthorizedError(message) {
  const error = new Error(message);
  error.code = 'UNAUTHORIZED';
  return error;
}

function mapErrorToMessage(error) {
  if (error?.code === 'UNAUTHORIZED') {
    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return 'Something went wrong while saving this page.';
}

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';
const DEFAULT_FRONTEND_BASE_URL = 'http://localhost:5173';
const RENDER_API_BASE_URL = 'https://datanest-ai.onrender.com/api';
const AUTH_COOKIE_NAME = 'jwtToken';
const SAVE_ENDPOINT = '/content/save';
const UPLOAD_ENDPOINT = '/content/upload';
const AUTH_CHECK_ENDPOINT = '/auth/me';
const LOGIN_ROUTE = '/login';
const DASHBOARD_ROUTE = '/dashboard';
const STORAGE_KEYS = {
  apiBaseUrl: 'apiBaseUrl',
  authToken: 'authToken',
};

const sessionActionButton = document.getElementById('sessionActionButton');
const sessionTitle = document.getElementById('sessionTitle');
const sessionDescription = document.getElementById('sessionDescription');
const sessionBadge = document.getElementById('sessionBadge');
const saveCurrentPageButton = document.getElementById('saveCurrentPageButton');
const activePageTitle = document.getElementById('activePageTitle');
const activePageUrl = document.getElementById('activePageUrl');
const linkForm = document.getElementById('linkForm');
const linkInput = document.getElementById('linkInput');
const saveLinkButton = document.getElementById('saveLinkButton');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileTitleInput = document.getElementById('fileTitleInput');
const uploadFileButton = document.getElementById('uploadFileButton');
const fileName = document.getElementById('fileName');
const fileMeta = document.getElementById('fileMeta');
const statusText = document.getElementById('status');

const buttonLabels = {
  saveCurrentPageButton: 'Save Current Page',
  saveLinkButton: 'Save Pasted Link',
  uploadFileButton: 'Upload File',
};

let popupSessionState = {
  ready: false,
  networkError: false,
  apiBaseUrl: DEFAULT_API_BASE_URL,
};

let popupViewState = {
  activeTab: null,
};

let activeActionButton = null;

const initializationPromise = initializePopup();

sessionActionButton.addEventListener('click', handleSessionActionClick);
saveCurrentPageButton.addEventListener('click', handleSaveCurrentPageClick);
linkForm.addEventListener('submit', handleSaveLinkSubmit);
uploadForm.addEventListener('submit', handleUploadSubmit);
fileInput.addEventListener('change', handleFileInputChange);

async function initializePopup() {
  updateUploadPreview(null);

  try {
    const [sessionState, activeTab] = await Promise.all([
      refreshSessionState({ preserveStatus: true }),
      loadActiveTabPreview(),
    ]);

    popupSessionState = sessionState;
    popupViewState.activeTab = activeTab;

    updateCurrentPagePreview(activeTab);
    updateSessionPanel(sessionState);
    updateControlAvailability();

    if (sessionState.ready) {
      setStatus('idle', 'Choose how you want to save this content.');
      return;
    }

    if (sessionState.networkError) {
      setStatus('error', 'Unable to reach the server. Check your backend or connection and try again.');
      return;
    }

    setStatus('error', 'Login required. Redirecting to sign in...');
    const session = await getStoredSession();
    await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), LOGIN_ROUTE);
  } catch {
    popupSessionState = {
      ready: false,
      networkError: true,
      apiBaseUrl: DEFAULT_API_BASE_URL,
    };
    updateSessionPanel(popupSessionState);
    updateControlAvailability();
    setStatus('error', 'Unable to initialize the extension right now.');
  }
}

async function handleSessionActionClick() {
  if (popupSessionState.ready) {
    const session = await getStoredSession();
    await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), DASHBOARD_ROUTE);
    return;
  }

  if (popupSessionState.networkError) {
    setStatus('loading', 'Retrying session check...');
    await refreshSessionState({ preserveStatus: false });
    updateSessionPanel(popupSessionState);
    updateControlAvailability();

    if (popupSessionState.ready) {
      setStatus('success', 'Connected. You can save content now.');
    } else if (popupSessionState.networkError) {
      setStatus('error', 'Still unable to reach the server. Check your backend and try again.');
    } else {
      setStatus('error', 'Login required. Open the web app and sign in first.');
    }
    return;
  }

  const session = await getStoredSession();
  await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), LOGIN_ROUTE);
}

async function handleSaveCurrentPageClick() {
  await runPopupAction({
    actionButton: saveCurrentPageButton,
    loadingLabel: 'Saving Current Page...',
    loadingStatus: 'Saving the current page...',
    successStatus: 'Current page saved. Opening dashboard...',
    work: async (session) => {
      const activeTab = popupViewState.activeTab || await loadActiveTabPreview();

      if (!activeTab?.id || !activeTab.supported) {
        throw new Error('Open a normal website page before saving the current tab.');
      }

      const pageData = await extractPageData(activeTab);
      return saveUrlContent(session.apiBaseUrl, session.token, pageData);
    },
    afterSuccess: async () => {
      await wait(320);
      const session = await getStoredSession();
      await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), DASHBOARD_ROUTE);
    },
  });
}

async function handleSaveLinkSubmit(event) {
  event.preventDefault();

  const normalizedUrl = String(linkInput.value || '').trim();

  if (!normalizedUrl) {
    setStatus('error', 'Paste a link you want to save.');
    linkInput.focus();
    return;
  }

  if (!isSupportedPage(normalizedUrl)) {
    setStatus('error', 'Enter a valid link starting with http:// or https://.');
    linkInput.focus();
    return;
  }

  await runPopupAction({
    actionButton: saveLinkButton,
    loadingLabel: 'Saving Link...',
    loadingStatus: 'Saving the pasted link...',
    successStatus: 'Link saved. Opening dashboard...',
    work: async (session) => saveUrlContent(session.apiBaseUrl, session.token, {
      url: normalizedUrl,
      title: '',
      description: '',
      image: '',
    }),
    afterSuccess: async () => {
      linkInput.value = '';
      await wait(320);
      const session = await getStoredSession();
      await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), DASHBOARD_ROUTE);
    },
  });
}

async function handleUploadSubmit(event) {
  event.preventDefault();

  const selectedFile = fileInput.files?.[0] || null;

  if (!selectedFile) {
    setStatus('error', 'Choose a PDF or image before uploading.');
    fileInput.focus();
    return;
  }

  if (!isSupportedUploadFile(selectedFile)) {
    setStatus('error', 'Only PDF and image files are supported.');
    return;
  }

  await runPopupAction({
    actionButton: uploadFileButton,
    loadingLabel: 'Uploading File...',
    loadingStatus: 'Uploading the file to your library...',
    successStatus: 'File uploaded. Opening dashboard...',
    work: async (session) => {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const normalizedTitle = String(fileTitleInput.value || '').trim();
      if (normalizedTitle) {
        formData.append('title', normalizedTitle);
      }

      return uploadFileContent(session.apiBaseUrl, session.token, formData);
    },
    afterSuccess: async () => {
      fileInput.value = '';
      fileTitleInput.value = '';
      updateUploadPreview(null);
      await wait(320);
      const session = await getStoredSession();
      await openOrFocusFrontendPage(resolveFrontendBaseUrl(session.apiBaseUrl), DASHBOARD_ROUTE);
    },
  });
}

function handleFileInputChange(event) {
  const selectedFile = event.target.files?.[0] || null;

  if (selectedFile && !isSupportedUploadFile(selectedFile)) {
    event.target.value = '';
    updateUploadPreview(null);
    setStatus('error', 'Only PDF and image files are supported.');
    return;
  }

  updateUploadPreview(selectedFile);

  if (selectedFile) {
    setStatus('idle', 'File selected. Upload it whenever you are ready.');
  }
}

async function runPopupAction({
  actionButton,
  loadingLabel,
  loadingStatus,
  successStatus,
  work,
  afterSuccess,
}) {
  setActionLoading(actionButton, loadingLabel, true);
  setStatus('loading', loadingStatus);

  try {
    const session = await ensureAuthenticatedSession();

    if (!session) {
      return;
    }

    await work(session);

    popupSessionState = {
      ...popupSessionState,
      ready: true,
      networkError: false,
      apiBaseUrl: session.apiBaseUrl,
    };
    updateSessionPanel(popupSessionState);
    updateControlAvailability();
    setStatus('success', successStatus);

    if (typeof afterSuccess === 'function') {
      await afterSuccess();
    }
  } catch (error) {
    if (error?.code === 'UNAUTHORIZED') {
      await clearStoredToken();
      popupSessionState = {
        ready: false,
        networkError: false,
        apiBaseUrl: error.apiBaseUrl || popupSessionState.apiBaseUrl || DEFAULT_API_BASE_URL,
      };
      updateSessionPanel(popupSessionState);
      updateControlAvailability();
      setStatus('error', 'Please login first.');
      await openOrFocusFrontendPage(resolveFrontendBaseUrl(popupSessionState.apiBaseUrl), LOGIN_ROUTE);
      return;
    }

    setStatus('error', mapErrorToMessage(error));
  } finally {
    setActionLoading(actionButton, loadingLabel, false);
  }
}

async function ensureAuthenticatedSession() {
  await initializationPromise;

  const storedSession = await getStoredSession();

  if (popupSessionState.ready && storedSession.token) {
    return storedSession;
  }

  const refreshedSessionState = await refreshSessionState({ preserveStatus: true });
  popupSessionState = refreshedSessionState;
  updateSessionPanel(refreshedSessionState);
  updateControlAvailability();

  const refreshedSession = await getStoredSession();

  if (refreshedSessionState.ready && refreshedSession.token) {
    return refreshedSession;
  }

  if (refreshedSessionState.networkError) {
    throw new Error('Unable to reach the server. Check your backend or connection and try again.');
  }

  setStatus('error', 'Please login first.');
  await openOrFocusFrontendPage(resolveFrontendBaseUrl(refreshedSession.apiBaseUrl), LOGIN_ROUTE);
  return null;
}

async function refreshSessionState({ preserveStatus = false } = {}) {
  if (!preserveStatus) {
    updateSessionPanel({
      ready: false,
      networkError: false,
      apiBaseUrl: popupSessionState.apiBaseUrl || DEFAULT_API_BASE_URL,
    }, {
      badgeState: 'loading',
      badgeLabel: 'Checking',
      title: 'Checking your login...',
      description: 'We are verifying your session with the web app.',
    });
  }

  try {
    const sessionState = await syncStoredSessionFromCookie();
    popupSessionState = sessionState;
    return sessionState;
  } catch {
    popupSessionState = {
      ready: false,
      networkError: true,
      apiBaseUrl: DEFAULT_API_BASE_URL,
    };
    return popupSessionState;
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

async function loadActiveTabPreview() {
  const activeTab = await getActiveTab();

  if (!activeTab) {
    return null;
  }

  return {
    id: activeTab.id,
    url: String(activeTab.url || '').trim(),
    title: String(activeTab.title || 'Untitled page').trim() || 'Untitled page',
    supported: isSupportedPage(activeTab.url),
  };
}

function updateCurrentPagePreview(activeTab) {
  if (!activeTab) {
    activePageTitle.textContent = 'No active tab found';
    activePageUrl.textContent = 'Open a website tab and reopen the popup to save the current page.';
    saveCurrentPageButton.textContent = 'Save Current Page';
    saveCurrentPageButton.disabled = true;
    return;
  }

  activePageTitle.textContent = activeTab.title;
  activePageUrl.textContent = activeTab.supported
    ? activeTab.url
    : 'This tab cannot be saved. Open a regular http or https page.';
  saveCurrentPageButton.textContent = buttonLabels.saveCurrentPageButton;
  saveCurrentPageButton.disabled = !popupSessionState.ready || !activeTab.supported;
}

function updateUploadPreview(file) {
  if (!file) {
    fileName.textContent = 'Choose a PDF or image';
    fileMeta.textContent = 'The file will be uploaded, tagged, and added to your library.';
    return;
  }

  const normalizedType = isPdfFile(file) ? 'PDF' : 'Image';
  fileName.textContent = file.name;
  fileMeta.textContent = `${normalizedType} - ${formatFileSize(file.size)}`;
}

function updateSessionPanel(sessionState, overrides = {}) {
  if (overrides.title) {
    sessionTitle.textContent = overrides.title;
    sessionDescription.textContent = overrides.description;
    sessionBadge.dataset.state = overrides.badgeState;
    sessionBadge.textContent = overrides.badgeLabel;
    sessionActionButton.textContent = 'Please wait...';
    sessionActionButton.disabled = true;
    return;
  }

  if (sessionState.ready) {
    sessionTitle.textContent = 'Connected to your Second Brain';
    sessionDescription.textContent = 'All save actions are ready. You can capture the current page, paste another link, or upload a file.';
    sessionBadge.dataset.state = 'success';
    sessionBadge.textContent = 'Ready';
    sessionActionButton.textContent = 'Open Library';
    sessionActionButton.disabled = false;
    return;
  }

  if (sessionState.networkError) {
    sessionTitle.innerHTML = `<a href="https://datanest-ai.onrender.com/login" target="_blank">Unable to verify the server right now click</a>`;
    sessionDescription.textContent = 'The popup cannot reach your backend at the moment. Retry the session check after your server is running again.';
    sessionBadge.dataset.state = 'error';
    sessionBadge.textContent = 'Offline';
    sessionActionButton.textContent = 'Retry Session';
    sessionActionButton.disabled = false;
    return;
  }

  sessionTitle.textContent = 'Login required before saving';
  sessionDescription.textContent = 'Sign in through the web app first, then reopen the extension to save pages, links, and uploads into your library.';
  sessionBadge.dataset.state = 'error';
  sessionBadge.textContent = 'Login';
  sessionActionButton.textContent = 'Open Login';
  sessionActionButton.disabled = false;
}

function updateControlAvailability() {
  const isReady = popupSessionState.ready;
  const currentTabSupported = Boolean(popupViewState.activeTab?.supported);

  linkInput.disabled = !isReady;
  saveLinkButton.disabled = !isReady;
  fileInput.disabled = !isReady;
  fileTitleInput.disabled = !isReady;
  uploadFileButton.disabled = !isReady;
  saveCurrentPageButton.disabled = !isReady || !currentTabSupported;

  if (!activeActionButton) {
    saveCurrentPageButton.textContent = buttonLabels.saveCurrentPageButton;
    saveLinkButton.textContent = buttonLabels.saveLinkButton;
    uploadFileButton.textContent = buttonLabels.uploadFileButton;
  }
}

function setActionLoading(actionButton, loadingLabel, isLoading) {
  activeActionButton = isLoading ? actionButton : null;

  const allControls = [
    saveCurrentPageButton,
    linkInput,
    saveLinkButton,
    fileInput,
    fileTitleInput,
    uploadFileButton,
    sessionActionButton,
  ];

  allControls.forEach((control) => {
    if (!control) {
      return;
    }

    control.disabled = isLoading;
  });

  if (actionButton) {
    actionButton.textContent = isLoading ? loadingLabel : buttonLabels[actionButton.id] || actionButton.textContent;
  }

  if (!isLoading) {
    updateSessionPanel(popupSessionState);
    updateControlAvailability();
    updateCurrentPagePreview(popupViewState.activeTab);
  }
}

async function saveUrlContent(apiBaseUrl, token, pageData) {
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
    throw new Error(getResponseMessage(payload, 'Failed to save content.'));
  }

  if (!payload || typeof payload !== 'object' || payload.success !== true) {
    throw createInvalidResponseError();
  }

  return payload;
}

async function uploadFileContent(apiBaseUrl, token, formData) {
  const response = await fetch(`${apiBaseUrl}${UPLOAD_ENDPOINT}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const payload = await parseJsonSafe(response);

  if (response.status === 401) {
    throw createUnauthorizedError(getResponseMessage(payload, 'Please login first'), apiBaseUrl);
  }

  if (!response.ok) {
    throw new Error(getResponseMessage(payload, 'Failed to upload file.'));
  }

  if (!payload || typeof payload !== 'object' || payload.success !== true) {
    throw createInvalidResponseError();
  }

  return payload;
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

function isSupportedUploadFile(file) {
  if (!file) {
    return false;
  }

  const normalizedType = String(file.type || '').toLowerCase();
  const normalizedName = String(file.name || '').toLowerCase();

  return normalizedType === 'application/pdf'
    || normalizedType.startsWith('image/')
    || /\.(pdf|png|jpe?g|webp|gif|bmp|svg)$/i.test(normalizedName);
}

function isPdfFile(file) {
  const normalizedType = String(file?.type || '').toLowerCase();
  const normalizedName = String(file?.name || '').toLowerCase();

  return normalizedType === 'application/pdf' || normalizedName.endsWith('.pdf');
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) {
    return 'Unknown size';
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
    return 'Please login first.';
  }

  if (error?.code === 'INVALID_RESPONSE') {
    return 'The server returned an invalid response.';
  }

  if (error instanceof TypeError) {
    return 'Unable to reach the server. Check your backend or connection and try again.';
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return 'Something went wrong while saving.';
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

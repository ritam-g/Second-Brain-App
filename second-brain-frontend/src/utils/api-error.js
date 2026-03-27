export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const responseData = error?.response?.data;

  if (error?.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  if (typeof responseData?.message === 'string' && responseData.message.trim()) {
    return responseData.message.trim();
  }

  if (typeof responseData?.error === 'string' && responseData.error.trim()) {
    return responseData.error.trim();
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

import { toast } from 'react-toastify';
import { getApiErrorMessage } from './api-error';

const defaultToastOptions = {
  autoClose: 3600,
  closeOnClick: true,
  draggable: true,
  pauseOnHover: true,
  pauseOnFocusLoss: true,
};

function withDefaults(options = {}) {
  return {
    ...defaultToastOptions,
    ...options,
  };
}

function resolveMessage(message, fallback, payload) {
  if (typeof message === 'function') {
    const resolvedMessage = message(payload);
    return typeof resolvedMessage === 'string' && resolvedMessage.trim() ? resolvedMessage : fallback;
  }

  return typeof message === 'string' && message.trim() ? message : fallback;
}

function resolveErrorMessage(message, error, fallback) {
  if (typeof message === 'function') {
    const resolvedMessage = message(error);
    return typeof resolvedMessage === 'string' && resolvedMessage.trim()
      ? resolvedMessage
      : getApiErrorMessage(error, fallback);
  }

  return typeof message === 'string' && message.trim()
    ? message
    : getApiErrorMessage(error, fallback);
}

export const notify = {
  success(message, options) {
    return toast.success(resolveMessage(message, 'Done'), withDefaults(options));
  },
  error(message, options) {
    return toast.error(resolveMessage(message, 'Something went wrong'), withDefaults(options));
  },
  info(message, options) {
    return toast.info(resolveMessage(message, 'For your information'), withDefaults(options));
  },
  warning(message, options) {
    return toast.warning(resolveMessage(message, 'Please review and try again'), withDefaults(options));
  },
  promise(promise, messages, options) {
    return toast.promise(
      promise,
      {
        pending: resolveMessage(messages?.pending, 'Working...'),
        success: {
          render({ data }) {
            return resolveMessage(messages?.success, 'Done', data);
          },
        },
        error: {
          render({ data }) {
            return resolveErrorMessage(messages?.error, data, 'Something went wrong');
          },
        },
      },
      withDefaults(options),
    );
  },
  dismiss(toastId) {
    toast.dismiss(toastId);
  },
};

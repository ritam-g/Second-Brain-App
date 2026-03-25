import React from 'react';
import {
  CircleAlert,
  CircleCheckBig,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toastIcons = {
  success: CircleCheckBig,
  error: CircleAlert,
  info: Info,
  warning: TriangleAlert,
};

const ToastIcon = ({ type, isLoading }) => {
  if (isLoading) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <LoaderCircle className="h-4 w-4 animate-spin" />
      </span>
    );
  }

  const Icon = toastIcons[type] || Info;
  const iconStyles = {
    success: 'bg-emerald-50 text-emerald-600',
    error: 'bg-rose-50 text-rose-600',
    info: 'bg-sky-50 text-sky-600',
    warning: 'bg-amber-50 text-amber-600',
  };

  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${iconStyles[type] || iconStyles.info}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
};

const CloseToastButton = ({ closeToast }) => (
  <button
    type="button"
    onClick={closeToast}
    className="mt-1 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    aria-label="Close notification"
  >
    <X className="h-4 w-4" />
  </button>
);

const AppToastContainer = () => (
  <ToastContainer
    position="top-right"
    newestOnTop
    limit={4}
    closeButton={CloseToastButton}
    icon={ToastIcon}
    toastClassName="app-toast"
    bodyClassName="app-toast-body"
    progressClassName="app-toast-progress"
  />
);

export default AppToastContainer;

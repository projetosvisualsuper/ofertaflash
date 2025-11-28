import toast from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const updateToast = (toastId: string, message: string, type: 'success' | 'error') => {
  toast.remove(toastId); // Remove o loading
  if (type === 'success') {
    showSuccess(message);
  } else {
    showError(message);
  }
};
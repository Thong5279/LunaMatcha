import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    return toast.success(message, {
      style: {
        background: '#DEE9CB',
        color: '#1a1a1a',
        border: '1px solid #A8C090',
        borderRadius: '12px',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#7A9A6E',
        secondary: '#DEE9CB',
      },
    });
  },

  error: (message) => {
    return toast.error(message, {
      style: {
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
        borderRadius: '12px',
        padding: '12px 16px',
      },
      iconTheme: {
        primary: '#dc2626',
        secondary: '#fee2e2',
      },
    });
  },

  info: (message) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#DEE9CB',
        color: '#1a1a1a',
        border: '1px solid #A8C090',
        borderRadius: '12px',
        padding: '12px 16px',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      style: {
        background: '#DEE9CB',
        color: '#1a1a1a',
        border: '1px solid #A8C090',
        borderRadius: '12px',
        padding: '12px 16px',
      },
    });
  },
};

export default showToast;




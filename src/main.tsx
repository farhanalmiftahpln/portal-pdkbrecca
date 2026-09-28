import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useAlertStore } from './store/useAlertStore';

// Override global alert
window.alert = (message?: any) => {
  useAlertStore.getState().showAlert(String(message));
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

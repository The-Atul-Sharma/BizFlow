import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt';
import { clearChunkReloadFlag, isChunkLoadError, reloadForStaleChunk } from '@/lib/chunkLoadError';
import { cleanPwaReloadParam } from '@/lib/pwaUpdate';
import { router } from './router';
import { getDatabase } from './services/db';
import './index.css';

clearChunkReloadFlag();
cleanPwaReloadParam();

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    reloadForStaleChunk();
  }
});

// Ensure database is initialized
getDatabase();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" closeButton />
    <PwaUpdatePrompt />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { PwaUpdatePrompt } from '@/components/PwaUpdatePrompt';
import { clearChunkReloadFlag, isChunkLoadError, reloadForStaleChunk } from '@/lib/chunkLoadError';
import { cleanPwaReloadParam } from '@/lib/pwaUpdate';
import { isSupabaseConfigured } from '@/lib/supabase';
import { router } from './router';
import { bootstrapDatabase, getCurrentUser, refreshFromSupabase } from './services/db';
import './index.css';

clearChunkReloadFlag();
cleanPwaReloadParam();

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    reloadForStaleChunk();
  }
});

// Keep data synced across devices ONLY when user is logged in
if (isSupabaseConfigured()) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && getCurrentUser()) {
      void refreshFromSupabase().catch(() => {});
    }
  });
}

async function startApp() {
  await bootstrapDatabase();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
      <PwaUpdatePrompt />
    </StrictMode>,
  );
}

void startApp();

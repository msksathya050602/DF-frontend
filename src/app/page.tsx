'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SignInPage from './sign-in/page';

const queryClient = new QueryClient();

export default function HomePage() {
  return (
    <main style={{ position: 'relative' }}>
      <QueryClientProvider client={queryClient}>
        <SignInPage />
      </QueryClientProvider>
    </main>
  );
}

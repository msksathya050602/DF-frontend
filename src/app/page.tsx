"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LoginPage from "./login/page";

const queryClient = new QueryClient();

export default function HomePage() {
  return (
    <main style={{ position: "relative" }}>
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    </main>
  );
}
interface Process {
  env: {
    NEXT_PUBLIC_APP_ENV: string;
    NEXT_PUBLIC_CONVO_AGENT_ID: string;
    NEXT_PUBLIC_CONVO_API_KEY: string;
    NEXT_PUBLIC_HEYGEN_URL: string;
    NEXT_PUBLIC_HEYGEN_API_KEY: string;
    NEXT_PUBLIC_HEYGEN_KNOWLEDGE_ID: string;
    NEXT_PUBLIC_HEYGEN_AVATAR_ID: string;
    NEXT_PUBLIC_OPENAI_API_KEY: string;
    NEXT_PUBLIC_API_SERVICE_URL: string;
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
  };
}
declare const process: Process;

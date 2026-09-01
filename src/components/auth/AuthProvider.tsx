'use client';

import { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // FE-only auth: không xác thực token ở server, chỉ dùng để cá nhân hoá UI, KHÔNG bảo vệ dữ liệu.
  return (
    <GoogleOAuthProvider clientId={clientId || 'placeholder-client-id.apps.googleusercontent.com'}>
      {children}
    </GoogleOAuthProvider>
  );
}

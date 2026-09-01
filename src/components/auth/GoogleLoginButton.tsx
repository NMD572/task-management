'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';

// FE-only auth: không xác thực token ở server, chỉ dùng để cá nhân hoá UI, KHÔNG bảo vệ dữ liệu.

export default function GoogleLoginButton() {
  const userProfile      = useAppStore((s) => s.userProfile);
  const setUserProfile   = useAppStore((s) => s.setUserProfile);
  const clearUserProfile = useAppStore((s) => s.clearUserProfile);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch user info from Google');
        const data = await res.json();

        // FE-only auth: không xác thực token ở server, chỉ dùng để cá nhân hoá UI, KHÔNG bảo vệ dữ liệu.
        setUserProfile({
          googleId: data.sub || '',
          name: data.name || 'Người dùng Google',
          email: data.email || '',
          avatarUrl: data.picture || '',
        });
      } catch (error) {
        console.error('Google profile fetch failed:', error);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
    },
  });

  const handleLoginClick = () => {
    if (!clientId) {
      // Fallback demo profile if Client ID is not configured yet in .env.local
      const proceed = confirm(
        'Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong file .env.local.\n\nBạn có muốn đăng nhập bằng tài khoản Demo để kiểm tra giao diện không?'
      );
      if (proceed) {
        // FE-only auth: không xác thực token ở server, chỉ dùng để cá nhân hoá UI, KHÔNG bảo vệ dữ liệu.
        setUserProfile({
          googleId: 'demo-user-123',
          name: 'Demo User',
          email: 'demo@example.com',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eisenhower',
        });
      }
      return;
    }
    handleGoogleLogin();
  };

  // If already logged in: show avatar + name + Logout button
  if (userProfile) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 pl-1.5 pr-2.5 py-1">
          {userProfile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-do_now text-white flex items-center justify-center text-xs font-bold">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
            </div>
          )}
          <span
            className="text-xs font-medium text-gray-800 max-w-[100px] truncate hidden sm:inline"
            title={userProfile.name}
          >
            {userProfile.name}
          </span>
        </div>

        <button
          type="button"
          onClick={clearUserProfile}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="flex items-center gap-1 rounded-lg border border-gray-200 p-2 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
        >
          <LogOut size={15} />
        </button>
      </div>
    );
  }

  // Not logged in: show Google Login button
  return (
    <button
      type="button"
      onClick={handleLoginClick}
      title="Đăng nhập với Google"
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shrink-0"
    >
      {/* Google "G" icon */}
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span className="hidden sm:inline">Đăng nhập</span>
    </button>
  );
}

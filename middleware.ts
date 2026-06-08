import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const isAuthPage = nextUrl.pathname.startsWith('/login');
  const isPublicApi = nextUrl.pathname.startsWith('/api/public');
  const isAuthApi = nextUrl.pathname.startsWith('/api/auth');

  // 公開エンドポイントはスルー
  if (isPublicApi || isAuthApi) {
    return NextResponse.next();
  }

  // ログイン済みでログインページにアクセスした場合はダッシュボードへ
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // 未ログインで保護ページにアクセスした場合はログインページへ
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // セキュリティヘッダーを追加
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co",
    ].join('; ')
  );

  return response;
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

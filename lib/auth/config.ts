import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8時間
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const supabase = createSupabaseAdminClient();

        // Supabase Auth でメール・パスワード認証
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (authError || !authData.user) return null;

        // staffテーブルからロール・組織情報を取得
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('id, name, email, role, organization_id, is_active')
          .eq('email', email)
          .single();

        if (staffError || !staffData || !staffData.is_active) return null;

        return {
          id: staffData.id,
          name: staffData.name,
          email: staffData.email,
          organization_id: staffData.organization_id,
          role: staffData.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organization_id = user.organization_id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.organization_id = token.organization_id as string;
      session.user.role = token.role as 'admin' | 'manager' | 'agent';
      return session;
    },
  },
});

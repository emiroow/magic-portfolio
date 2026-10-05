'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

type LoginForm = z.infer<typeof loginSchema>;

/** Login form state + NextAuth credentials sign-in with callback URL. */
const useAuth = () => {
  const t = useTranslations('auth.login');
  const locale = useLocale();
  const search = useSearchParams();
  const callbackUrl = search.get('callbackUrl') || `/${locale}/dashboard`;

  const {
    handleSubmit,
    register,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });
      if (!res) throw new Error('No response from auth server');
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: res => {
      // Never trust NEXTAUTH_URL blindly (it can point at another origin):
      // prefer the in-app callbackUrl, and fall back to the dashboard.
      const safeTarget = callbackUrl.startsWith('/') ? callbackUrl : `/${locale}/dashboard`;
      const target = res.url && res.url.startsWith(window.location.origin) ? res.url : safeTarget;
      // Hard redirect so the session cookie is picked up everywhere.
      window.location.href = target;
    },
    onError: () => {
      setError('root', { message: t('invalidCredentials') });
    },
  });

  return {
    handleSubmit,
    register,
    errors,
    isPending: mutation.isPending,
    onSubmit: (data: LoginForm) => mutation.mutate(data),
  };
};

export default useAuth;

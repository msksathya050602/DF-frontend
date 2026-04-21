'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import SignIn from '@components/SignIn';
import { ROUTES } from '@constants/routes';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import * as yup from 'yup';

import { LocalStorage, setStorageKey } from '@/helpers/storage';
import { basicAuthLogin } from '@/services/api/auth';
import { loginSchema } from '@/utils/schema';

export default function SignInPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const normalizeRoles = (roles: unknown): string[] => {
    const list = Array.isArray(roles) ? roles : [];
    return list
      .flatMap((r) => {
        const str = String(r ?? '');
        if (str.includes('[') && str.includes(']')) {
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            // ignore
          }
        }
        return [str];
      })
      .map((r) =>
        String(r)
          .replace(/[[\]"]/g, '')
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<yup.InferType<typeof loginSchema>>({
    resolver: yupResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');
    setSuccessMessage('');
    try {
      const { accessToken, refreshToken, roles } = await basicAuthLogin({
        email: data.email,
        password: data.password,
      });
      setStorageKey(LocalStorage.ACCESS_TOKEN, accessToken);
      setStorageKey(LocalStorage.REFRESH_TOKEN, refreshToken);
      normalizeRoles(roles);
      router.push(ROUTES.BILLING);
    } catch (error: any) {
      setServerError(error?.response?.data?.error_message || 'Login failed. Please try again.');
    }
  });

  return (
    <SignIn
      title="Sign in"
      subtitle="Please enter your credentials to continue."
      emailError={errors.email?.message}
      passwordError={errors.password?.message}
      serverError={serverError}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
      isPasswordVisible={isPasswordVisible}
      onTogglePassword={() => setIsPasswordVisible((value) => !value)}
      onSignUpClick={() => router.push(ROUTES.SIGN_UP)}
      onForgotPasswordClick={() =>
        setServerError('Password reset is not enabled yet. Please contact the admin.')
      }
      onSubmit={onSubmit}
      emailInputProps={register('email')}
      passwordInputProps={register('password')}
    />
  );
}

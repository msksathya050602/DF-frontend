'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import SignUp from '@components/SignUp';
import { ROUTES } from '@constants/routes';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import * as yup from 'yup';

import { LocalStorage, setStorageKey } from '@/helpers/storage';
import { registerUser } from '@/services/api/auth';
import { signUpSchema } from '@/utils/schema';

export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

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
  } = useForm<yup.InferType<typeof signUpSchema>>({
    resolver: yupResolver(signUpSchema),
    mode: 'onSubmit',
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError('');
    setSuccessMessage('');
    try {
      const { accessToken, refreshToken, roles } = await registerUser({
        userName: data.userName.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      setStorageKey(LocalStorage.ACCESS_TOKEN, accessToken);
      setStorageKey(LocalStorage.REFRESH_TOKEN, refreshToken);
      normalizeRoles(roles);
      router.push(ROUTES.BILLING);
    } catch (error: any) {
      setServerError(
        error?.response?.data?.error_message || 'Could not create your account. Please try again.'
      );
    }
  });

  return (
    <SignUp
      title="Create account"
      subtitle="Enter your details to register and continue."
      userNameError={errors.userName?.message}
      emailError={errors.email?.message}
      passwordError={errors.password?.message}
      confirmPasswordError={errors.confirmPassword?.message}
      serverError={serverError}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
      isPasswordVisible={isPasswordVisible}
      isConfirmPasswordVisible={isConfirmPasswordVisible}
      onTogglePassword={() => setIsPasswordVisible((value) => !value)}
      onToggleConfirmPassword={() => setIsConfirmPasswordVisible((value) => !value)}
      onSignInClick={() => router.push(ROUTES.SIGN_IN)}
      onSubmit={onSubmit}
      userNameInputProps={register('userName')}
      emailInputProps={register('email')}
      passwordInputProps={register('password')}
      confirmPasswordInputProps={register('confirmPassword')}
    />
  );
}

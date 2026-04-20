"use client";

import "../SignIn/signin.scss";

import { InputHTMLAttributes } from "react";

import { AppButton, AppText, AppTextInput } from "@/components/common/widgets";

type SignUpProps = {
  title: string;
  subtitle: string;
  userNameError?: string;
  emailError?: string;
  passwordError?: string;
  confirmPasswordError?: string;
  serverError?: string;
  successMessage?: string;
  isSubmitting: boolean;
  isPasswordVisible: boolean;
  isConfirmPasswordVisible: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSignInClick: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  userNameInputProps: InputHTMLAttributes<HTMLInputElement>;
  emailInputProps: InputHTMLAttributes<HTMLInputElement>;
  passwordInputProps: InputHTMLAttributes<HTMLInputElement>;
  confirmPasswordInputProps: InputHTMLAttributes<HTMLInputElement>;
};

export default function SignUp({
  title,
  subtitle,
  userNameError,
  emailError,
  passwordError,
  confirmPasswordError,
  serverError,
  successMessage,
  isSubmitting,
  isPasswordVisible,
  isConfirmPasswordVisible,
  onTogglePassword,
  onToggleConfirmPassword,
  onSignInClick,
  onSubmit,
  userNameInputProps,
  emailInputProps,
  passwordInputProps,
  confirmPasswordInputProps,
}: SignUpProps) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <header className="auth-topbar">
          <div className="auth-topbar-spacer" />
          <AppText as="p" className="auth-topbar-text">
            Already have an account?{" "}
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              className="auth-topbar-link"
              onClick={onSignInClick}
            >
              Sign in
            </AppButton>
          </AppText>
        </header>

        <section className="auth-left">
          <div className="auth-card">
            <AppText as="h1" className="auth-title">
              {title}
            </AppText>
            <AppText as="p" className="auth-subtitle">
              {subtitle}
            </AppText>

            <form className="auth-form" onSubmit={onSubmit}>
              <AppText as="label" className="auth-label" htmlFor="userName">
                Username
              </AppText>
              <AppTextInput
                id="userName"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                wrapperClassName="auth-inputBlock"
                className="auth-input"
                error={userNameError}
                {...userNameInputProps}
              />

              <AppText as="label" className="auth-label" htmlFor="email">
                Email
              </AppText>
              <AppTextInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                wrapperClassName="auth-inputBlock"
                className="auth-input"
                error={emailError}
                {...emailInputProps}
              />

              <AppText as="label" className="auth-label" htmlFor="password">
                Password
              </AppText>
              <div className="auth-passwordRow">
                <AppTextInput
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  wrapperClassName="auth-inputBlock auth-inputBlock--password"
                  className="auth-input auth-input--password"
                  error={passwordError}
                  {...passwordInputProps}
                />
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="auth-passwordToggle"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  onClick={onTogglePassword}
                >
                  {isPasswordVisible ? "Hide" : "Show"}
                </AppButton>
              </div>

              <AppText as="label" className="auth-label" htmlFor="confirmPassword">
                Confirm password
              </AppText>
              <div className="auth-passwordRow">
                <AppTextInput
                  id="confirmPassword"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  wrapperClassName="auth-inputBlock auth-inputBlock--password"
                  className="auth-input auth-input--password"
                  error={confirmPasswordError}
                  {...confirmPasswordInputProps}
                />
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="auth-passwordToggle"
                  aria-label={isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
                  onClick={onToggleConfirmPassword}
                >
                  {isConfirmPasswordVisible ? "Hide" : "Show"}
                </AppButton>
              </div>

              <AppButton
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                className="auth-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </AppButton>

              {serverError && (
                <AppText as="small" className="auth-error">
                  {serverError}
                </AppText>
              )}
              {successMessage && (
                <AppText as="small" className="auth-success">
                  {successMessage}
                </AppText>
              )}
            </form>

            <AppText as="p" className="auth-footer">
              © Copyright {new Date().getFullYear()}, Daily Fresh - All rights reserved.
            </AppText>
          </div>
        </section>

        <section className="auth-right" aria-hidden="true">
          <div className="auth-brand">
            <div className="auth-brandInner">
              <div className="auth-mark">DF</div>
              <div className="auth-brandText">DAILY FRESH</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

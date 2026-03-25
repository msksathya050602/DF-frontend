"use client";

import "./styles.scss";

import { InputHTMLAttributes } from "react";
import { AppButton, AppText, AppTextInput } from "@/components/common/widgets";

type AuthLoginTemplateProps = {
  title: string;
  subtitle: string;
  emailError?: string;
  passwordError?: string;
  serverError?: string;
  successMessage?: string;
  isSubmitting: boolean;
  isPasswordVisible: boolean;
  onTogglePassword: () => void;
  onSignUpClick: () => void;
  onForgotPasswordClick: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  emailInputProps: InputHTMLAttributes<HTMLInputElement>;
  passwordInputProps: InputHTMLAttributes<HTMLInputElement>;
};

export default function AuthLoginTemplate({
  title,
  subtitle,
  emailError,
  passwordError,
  serverError,
  successMessage,
  isSubmitting,
  isPasswordVisible,
  onTogglePassword,
  onSignUpClick,
  onForgotPasswordClick,
  onSubmit,
  emailInputProps,
  passwordInputProps,
}: AuthLoginTemplateProps) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <header className="auth-topbar">
          <div className="auth-topbar-spacer" />
          <AppText as="p" className="auth-topbar-text">
            Don&apos;t have an account?{" "}
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              className="auth-topbar-link"
              onClick={onSignUpClick}
            >
              Sign up
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

              <div className="auth-optionsRow">
                <label className="auth-checkbox">
                  <input type="checkbox" />
                  <span>Keep me signed in</span>
                </label>
                <AppButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="auth-forgotLink"
                  onClick={onForgotPasswordClick}
                >
                  Forgot password?
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
                {isSubmitting ? "Signing in..." : "Sign in"}
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

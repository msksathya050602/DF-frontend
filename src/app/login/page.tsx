"use client";

import "./login.scss";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { LocalStorage, setStorageKey } from "@/helpers/storage";
import { basicAuthLogin } from "@/services/api/auth";
import { loginSchema } from "@/utils/schema";

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<yup.InferType<typeof loginSchema>>({
    resolver: yupResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError("");
    setSuccessMessage("");
    try {
      const { accessToken, refreshToken } = await basicAuthLogin({
        email: data.email,
        password: data.password,
      });
      setStorageKey(LocalStorage.ACCESS_TOKEN, accessToken);
      setStorageKey(LocalStorage.REFRESH_TOKEN, refreshToken);
      setSuccessMessage("Login successful.");
      reset();
    } catch (error: any) {
      setServerError(error?.response?.data?.error_message || "Login failed. Please try again.");
    }
  });

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-title">Welcome to Daily Fresh</h1>
        <p className="login-subtitle">Sign in to continue.</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="login-input"
            {...register("email")}
          />
          {errors.email?.message && <small className="login-error">{errors.email.message}</small>}

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className="login-input"
            {...register("password")}
          />
          {errors.password?.message && (
            <small className="login-error">{errors.password.message}</small>
          )}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
          {serverError && <small className="login-error">{serverError}</small>}
          {successMessage && <small className="login-success">{successMessage}</small>}
        </form>
      </section>
    </main>
  );
}

"use client";

import "./styles.scss";

import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type AppTextProps = {
  as?:
    | "p"
    | "span"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "small"
    | "label"
    | "strong"
    | "em"
    | "div"
    | "li";
  children: ReactNode;
  className?: string;
  tone?: "default" | "muted" | "primary" | "success" | "danger" | "warning";
  align?: "left" | "center" | "right";
  weight?: "normal" | "medium" | "semibold" | "bold";
  htmlFor?: string;
  style?: CSSProperties;
  [key: string]: unknown;
};

export function AppText({
  as = "p",
  children,
  className,
  tone = "default",
  align = "left",
  weight = "normal",
  ...props
}: AppTextProps) {
  const Tag = as;
  return (
    <Tag className={`app-text app-text--${tone} app-text--${align} app-text--${weight} ${className || ""}`.trim()} {...props}>
      {children}
    </Tag>
  );
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
};

export function AppButton({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={`app-button app-button--${variant} app-button--${size} ${fullWidth ? "app-button--full" : ""} ${className || ""}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

type AppTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
};

export function AppTextInput({
  label,
  error,
  helperText,
  className,
  wrapperClassName,
  id,
  ...props
}: AppTextInputProps) {
  return (
    <div className={`app-inputWrapper ${wrapperClassName || ""}`.trim()}>
      {label && (
        <AppText as="label" className="app-fieldLabel" htmlFor={id}>
          {label}
        </AppText>
      )}
      <input className={`app-input ${error ? "app-input--error" : ""} ${className || ""}`.trim()} {...props} />
      {error && <small className="app-inputError">{error}</small>}
      {!error && helperText && <small className="app-inputHelper">{helperText}</small>}
    </div>
  );
}

type AppTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
};

export function AppTextarea({
  label,
  error,
  helperText,
  className,
  wrapperClassName,
  id,
  ...props
}: AppTextareaProps) {
  return (
    <div className={`app-inputWrapper ${wrapperClassName || ""}`.trim()}>
      {label && (
        <AppText as="label" className="app-fieldLabel" htmlFor={id}>
          {label}
        </AppText>
      )}
      <textarea
        className={`app-input app-textarea ${error ? "app-input--error" : ""} ${className || ""}`.trim()}
        id={id}
        {...props}
      />
      {error && <small className="app-inputError">{error}</small>}
      {!error && helperText && <small className="app-inputHelper">{helperText}</small>}
    </div>
  );
}

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  wrapperClassName?: string;
  options: Array<{ label: string; value: string }>;
};

export function AppSelect({
  label,
  error,
  helperText,
  className,
  wrapperClassName,
  id,
  options,
  ...props
}: AppSelectProps) {
  return (
    <div className={`app-inputWrapper ${wrapperClassName || ""}`.trim()}>
      {label && (
        <AppText as="label" className="app-fieldLabel" htmlFor={id}>
          {label}
        </AppText>
      )}
      <select className={`app-input app-select ${error ? "app-input--error" : ""} ${className || ""}`.trim()} id={id} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <small className="app-inputError">{error}</small>}
      {!error && helperText && <small className="app-inputHelper">{helperText}</small>}
    </div>
  );
}

type AppCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
};

export function AppCheckbox({ label, className, ...props }: AppCheckboxProps) {
  return (
    <label className={`app-checkbox ${className || ""}`.trim()}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

type AppLinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export function AppLinkButton({ children, className, ...props }: AppLinkButtonProps) {
  return (
    <a className={`app-linkButton ${className || ""}`.trim()} {...props}>
      {children}
    </a>
  );
}

type AppBadgeProps = {
  children: ReactNode;
  tone?: "default" | "primary" | "success" | "danger" | "warning";
  className?: string;
};

export function AppBadge({ children, tone = "default", className }: AppBadgeProps) {
  return <span className={`app-badge app-badge--${tone} ${className || ""}`.trim()}>{children}</span>;
}

type AppCardProps = {
  children: ReactNode;
  className?: string;
};

export function AppCard({ children, className }: AppCardProps) {
  return <div className={`app-card ${className || ""}`.trim()}>{children}</div>;
}

type AppStackProps = {
  children: ReactNode;
  direction?: "row" | "column";
  gap?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  className?: string;
};

export function AppStack({
  children,
  direction = "column",
  gap = 8,
  align = "stretch",
  justify = "flex-start",
  className,
}: AppStackProps) {
  return (
    <div
      className={`app-stack ${className || ""}`.trim()}
      style={{ display: "flex", flexDirection: direction, gap: `${gap}px`, alignItems: align, justifyContent: justify }}
    >
      {children}
    </div>
  );
}

type AppDividerProps = {
  className?: string;
};

export function AppDivider({ className }: AppDividerProps) {
  return <hr className={`app-divider ${className || ""}`.trim()} />;
}

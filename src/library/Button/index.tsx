import "./button.scss";
import colors from "@theme/colors.module.scss";

import React, { Fragment } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Is this the principal call to action on the page?
   */
  buttonType?: "primary" | "secondary" | "warning" | "danger" | "plain";
  /**
   * What background color to use
   */
  backgroundColor?: string;
  leftIcon?: React.ElementType;
  borderColor?: string;
  disable?: boolean;
  rightIcon?: React.ElementType;
  width?: string;
  isLoading?: boolean;
  loadingColor?: string;
  height?: string;
  borderRadius?: string;
  /**
   * What border and color like 1px solid #000
   */
  fullWidth?: boolean;
  backgroundColorOnHover?: string;
  /**
   * background color on hover based on id selector
   */

  /**
   * What color pf text like == #fff
   */
  color?: string;
  /**
   * How large should the button be?
   */
  additionalsize?: "small" | "medium" | "large";
  /**
   * Button contents
   */
  label: React.ReactNode | string;
}

/**
 * Primary UI component for user interaction
 */

interface CustomStyleButton {
  width?: string;
  border?: string;
  color?: string;
  backgroundColor?: string;
  pointerEvents: "all" | "none";
}

export const Button = ({
  buttonType,
  type,
  additionalsize = "medium",
  disable,
  loadingColor,
  isLoading,
  height,
  className,
  leftIcon: LeftIcon,
  borderRadius,
  width,
  borderColor,
  rightIcon: RightIcon,
  backgroundColor,
  color,
  fullWidth,
  label,
  backgroundColorOnHover,
  ...props
}: ButtonProps) => {
  const customStyle: CustomStyleButton = {
    width: fullWidth ? "100%" : width,
    backgroundColor: disable ? colors.B1 : backgroundColor,
    color: disable ? colors.B4 : color,
    pointerEvents: disable ? "none" : "all",
  };
  let mode = className;
  switch (buttonType) {
    case "primary":
      mode += " button--primary";
      break;
    case "secondary":
      mode += " button--secondary";
      customStyle.border = `1px solid ${borderColor}`;
      break;
    case "danger":
      mode += " button--danger";
      break;
    case "warning":
      mode += " button--warning";
      break;
    case "plain":
      mode += " button--plain";
      break;
    default:
      mode = className;
  }
  const onhover = `
    button{
        transition:background-color 0.3s;
    }
    button#${props.id}:hover{
        background-color:${backgroundColorOnHover} !important;
    }`;
  return (
    <>
      {props.id && backgroundColorOnHover && <style>{onhover}</style>}
      <button
        type={type ? type : "button"}
        {...props}
        className={["button", `button--${additionalsize}`, mode].join(" ")}
        style={{ backgroundColor, height, color, borderRadius, ...customStyle }}
      >
        {!isLoading ? (
          <Fragment>
            {LeftIcon && <LeftIcon />}
            {label}
            {RightIcon && <RightIcon />}
          </Fragment>
        ) : (
          <span
            className="loader"
            style={{
              ...(loadingColor ? { borderTopColor: loadingColor } : {}),
            }}
          ></span>
        )}
      </button>
    </>
  );
};

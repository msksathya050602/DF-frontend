import "./customInput.scss";

import React, { forwardRef } from "react";
import EyeClose from "@assets/images/library/eyeClose.svg";
import EyeOpen from "@assets/images/library/eyeOpen.svg";
import Info from "@assets/images/library/info.svg";
import { stylize } from "@functions/stylize";
import { FallbackLine } from "@library/FallbackLine";
import Tooltip from "@library/Tooltip/tooltip";
import Typography from "@library/Typography";

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement> {
  label: string;
  error?: string;
  loading?: boolean;
  as?: "input" | "textarea";
  groupClass?: string;
  labelStyle?: React.CSSProperties;
  info?: string;
  isRequired?: boolean;
  hasEye?: boolean;
  exampleText?: string;
}

const CustomInput = forwardRef(
  (
    props: InputProps,
    ref: React.Ref<HTMLInputElement & HTMLTextAreaElement>,
  ) => {
    const {
      label,
      type,
      as: Element = "input",
      loading,
      defaultValue,
      isRequired,
      readOnly,
      onClick,
      error,
      className,
      hasEye,
      labelStyle,
      groupClass,
      info,
      exampleText,
      ...otherProps
    } = props;
    const [originalType, setOriginalType] = React.useState(type);
    return (
      <div className="form-group-wrapper">
        {label && (
          <div className="info-wrapper">
            <Typography
              type="p3"
              weight="regular"
              text={stylize(label)}
              as="strong"
              className={` custom-label ${isRequired ? "required" : ""}`}
              style={labelStyle}
              color={labelStyle?.color || "black"}
            />
            {info && (
              <Tooltip infoText={info}>
                <Info className="info" />
              </Tooltip>
            )}
          </div>
        )}
        <div
          className={`form-group ${groupClass || ""}${error ? " error" : ""}`}
        >
          {!loading ? (
            <Element
              ref={ref}
              type={originalType}
              defaultValue={defaultValue}
              readOnly={readOnly}
              onClick={onClick}
              className={`custom-input ${className || ""} ${isRequired ? "required" : ""}`}
              {...otherProps}
              onKeyUp={
                Element === "textarea"
                  ? (element) => {
                      element.currentTarget.style.height =
                        element.currentTarget.scrollHeight + "px";
                    }
                  : () => {}
              }
              onFocusCapture={
                Element === "textarea"
                  ? (element) => {
                      element.currentTarget.style.height =
                        element.currentTarget.scrollHeight + "px";
                    }
                  : () => {}
              }
            />
          ) : (
            <FallbackLine
              className={""}
              containerStyle={{}}
              lineStyle={{ width: "100%", height: "40px", borderRadius: "5px" }}
            />
          )}
          {hasEye && (
            <div className="eye">
              {originalType === "password" ? (
                <EyeClose onClick={() => setOriginalType("text")} />
              ) : (
                <EyeOpen onClick={() => setOriginalType("password")} />
              )}
            </div>
          )}
        </div>
        {exampleText && !error && (
          <Typography
            type="caption"
            weight="light"
            text={exampleText}
            as="small"
            color="gray"
            className="example-text"
          />
        )}
        {error && (
          <Typography
            type="caption"
            weight="light"
            text={error}
            as="small"
            id="error-message"
            color="red"
          />
        )}
      </div>
    );
  },
);
CustomInput.displayName = "CustomInput";

export default CustomInput;

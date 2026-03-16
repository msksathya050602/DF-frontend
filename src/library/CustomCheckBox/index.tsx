import "./customCheckBox.scss";

import React, { FC, ReactElement } from "react";
import CustomInput from "@library/CustomInput";
import Typography from "@library/Typography";

interface CheckboxGroupProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  options: {
    label: string;
    value: string;
    disabled?: boolean;
    description?: string;
  }[];
  label: string;
  labelElement?: ReactElement;
  error?: string;
  isRequired?: boolean;
  checkedValues?: string[];
  skipHover?: boolean;
  allowOne?: boolean;
  style?: React.CSSProperties;
}

export const CustomCheckBox: FC<CheckboxGroupProps> = ({
  label,
  options,
  skipHover,
  labelElement,
  error,
  isRequired,
  checkedValues,
  style,
  defaultValue = [],
  allowOne,
  ...inputProps
}) => {
  return (
    <div className="checkbox-group-card">
      <div className="checkbox-group-wrapper">
        <div className={`info-wrapper ${isRequired ? "required" : ""}`}>
          {labelElement}
        </div>

        <div className="checkbox-group">
          {options.map((val, index) => (
            <label
              key={`checkbox-${index}`}
              className="checkbox-title-description-wrapper"
            >
              <div
                className={`checkbox-group-item ${checkedValues?.includes(val.value) ? "selected" : ""} ${skipHover ? "skip" : ""}`}
                style={style}
              >
                <CustomInput
                  label={""}
                  type={allowOne ? "radio" : "checkbox"}
                  name={allowOne ? label : val.value}
                  {...inputProps}
                  defaultValue={val.value}
                  disabled={val.disabled}
                />
                <Typography
                  type="caption"
                  weight="light"
                  text={val.label}
                  as="span"
                />
              </div>
              {val.description && (
                <Typography
                  type="p3"
                  weight="light"
                  text={val.description}
                  as="small"
                />
              )}
            </label>
          ))}
        </div>
      </div>
      {error && (
        <Typography
          type="caption"
          weight="light"
          text={error}
          as="small"
          color="red"
          id="error-message"
        />
      )}
    </div>
  );
};

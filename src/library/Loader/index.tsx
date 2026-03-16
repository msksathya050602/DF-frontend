import "./loader.scss";
import colors from "@theme/colors.module.scss";

import React from "react";

type LoaderProps = {
  borderTopColor?: string;
  children?: React.ReactNode;
  className?: string;
  borderSize?: `${number}px`;
  width?: `${number}px`;
  height?: `${number}px`;
  padding?: `${number}px`;
};

export const Loader: React.FC<LoaderProps> = ({
  className = "",
  padding = "16px",
  borderSize = "7px",
  width,
  height,
  borderTopColor = colors.DotBlue,
  children,
}) => {
  return (
    <div className={`loader-wrapper ${className}`}>
      <div
        className="loader"
        style={{
          border: `${borderSize} solid  #ddd`,
          borderTopColor,
          padding,
          ...(width && { width }),
          ...(height && { height }),
        }}
      ></div>
      {children}
    </div>
  );
};

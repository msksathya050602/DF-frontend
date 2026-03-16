import "./modal.scss";

import React, { CSSProperties } from "react";
import Close from "@assets/icons/close.svg";

export const Modal = ({
  handleModal,
  children,
  isCloseIcon,
  style,
  className,
}: {
  handleModal?: () => void;
  children: React.ReactNode;
  isCloseIcon?: boolean;
  style?: CSSProperties;
  className?: string;
}) => {
  return (
    <div className={`modal ${className}`} style={style}>
      {isCloseIcon && (
        <div className="close-icon" onClick={handleModal}>
          <Close />
        </div>
      )}
      {children}
    </div>
  );
};

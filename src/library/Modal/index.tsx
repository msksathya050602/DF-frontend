import './modal.scss';

import React, { CSSProperties } from 'react';
import Close from '@assets/icons/close.svg';

export const Modal = ({
  handleModal,
  children,
  isCloseIcon,
  style,
  className,
  onBackdropClick,
}: {
  handleModal?: () => void;
  children: React.ReactNode;
  isCloseIcon?: boolean;
  style?: CSSProperties;
  className?: string;
  onBackdropClick?: () => void;
}) => {
  return (
    <div
      className={`modal ${className}`}
      style={style}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onBackdropClick?.();
        }
      }}
    >
      {isCloseIcon && (
        <div className="close-icon" onClick={handleModal}>
          <Close />
        </div>
      )}
      {children}
    </div>
  );
};

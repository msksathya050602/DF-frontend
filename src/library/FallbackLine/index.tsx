import './fallbackLine.scss';

import React from 'react';
export const FallbackLine = ({
  lineStyle,
  containerStyle,
  className,
}: {
  className: string;
  containerStyle: React.CSSProperties;
  lineStyle: React.CSSProperties;
}) => {
  return (
    <div className={`fall-back-wrapper ${className ?? ''}`} style={containerStyle}>
      <div className="fall-back-line" style={lineStyle}></div>
    </div>
  );
};

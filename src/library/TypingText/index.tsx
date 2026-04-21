'use client';
import './typingText.scss';

import React, { useEffect, useState } from 'react';
import Typography, { TypographyProps } from '@library/Typography';

export interface TypingTextProps extends TypographyProps {
  text: string;
  speed?: number;
}
export const TypingText: React.FC<TypingTextProps> = ({ text, speed = 100, ...rest }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        setShowCursor(false);
        clearInterval(timer);
      }
    }, speed);
    return () => {
      setDisplayedText('');
      setShowCursor(false);
      clearInterval(timer);
    };
  }, [text, speed]);

  return (
    <div className="typing-text">
      <Typography text={displayedText} {...rest} />
      {showCursor && (
        <span className="cursor" style={{ animationDuration: `${speed + 100}ms` }}>
          |
        </span>
      )}
    </div>
  );
};

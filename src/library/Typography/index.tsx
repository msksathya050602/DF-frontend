import './typography.scss';
import colors from '@theme/colors.module.scss';

import React, { ElementType, ReactElement, ReactNode } from 'react';

interface TypographyProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Typography type
   */
  type:
    | 'p1'
    | 'p2'
    | 'p3'
    | 'caption'
    | 'mini'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'd1'
    | 'd2'
    | 'd3'
    | 'd4'
    | 'd5';
  /**
   * Typography type
   */
  weight: 'light' | 'regular' | 'semiboldItalic' | 'semibold' | 'black';
  /**
   * The text to display
   */
  text: string | ReactNode;
  /**
   * Optional logo to display following the text
   */
  /**
   * Custom element tag
   */
  as?: ElementType;
  /**
   * Font color
   */
  color?:
    | 'black'
    | typeof colors.B9
    | typeof colors.B4
    | typeof colors.B5
    | typeof colors.B0
    | typeof colors.T5;
}

const Typography = ({
  type,
  weight,
  text,
  color = 'black',
  style,
  as: Tag = 'span',
  ...props
}: TypographyProps) => {
  const { className, ...rest } = { ...props };
  return (
    <Tag
      className={['typography', type, weight, className].join(' ')}
      style={{ color, ...style }}
      {...rest}
    >
      {text}
    </Tag>
  );
};

export type { TypographyProps };
export default Typography;
export { Typography };

import React from 'react';
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}

declare module 'mathlive' {
  export interface MathLiveProps {
    style?: React.CSSProperties;
    virtualKeyboardMode?: 'manual' | 'onfocus' | 'onfocus-within';
    value?: string;
    onChange?: (value: string) => void;
  }

  export const MathLive: React.FC<MathLiveProps>;
} 
declare module 'react-katex' {
  import { ComponentType } from 'react';
  export const InlineMath: ComponentType<{ math?: string; children?: string; errorColor?: string }>;
  export const BlockMath: ComponentType<{ math?: string; children?: string; errorColor?: string }>;
}

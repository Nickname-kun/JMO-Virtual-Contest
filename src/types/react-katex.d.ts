declare module 'react-katex' {
  import { Component } from 'react'

  interface MathProps {
    math: string
  }

  export class InlineMath extends Component<MathProps> {}
  export class BlockMath extends Component<MathProps> {}
} 
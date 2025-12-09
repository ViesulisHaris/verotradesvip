'use client';

import React from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
}

export default function TextReveal({ text, className = '' }: TextRevealProps) {
  return (
    <span className={className}>
      {text}
    </span>
  )
}
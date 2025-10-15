'use client'

import { MediaRenderer as ThirdwebMediaRenderer } from "thirdweb/react";
import { client } from "@/lib/thirdweb";

interface MediaRendererProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: string;
  height?: string;
}

export function MediaRenderer({ src, alt, className, style, width, height }: MediaRendererProps) {
  // Handle IPFS URIs and regular URLs
  // Ensure object-cover is applied by default
  const mergedClassName = className?.includes('object-') ? className : `${className || ''} object-cover`.trim();

  // Force object-cover via style to override Thirdweb's inline styles
  const mergedStyle: React.CSSProperties = {
    objectFit: 'cover',
    ...style,
  };

  return (
    <ThirdwebMediaRenderer
      client={client}
      src={src}
      alt={alt}
      className={mergedClassName}
      style={mergedStyle}
      width={width}
      height={height}
    />
  );
}
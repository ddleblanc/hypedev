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
  return (
    <ThirdwebMediaRenderer
      client={client}
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
    />
  );
}
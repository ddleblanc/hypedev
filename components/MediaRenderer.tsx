'use client'

import { MediaRenderer as ThirdwebMediaRenderer } from 'thirdweb/react'
import { client } from '@/lib/thirdweb'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

interface MediaRendererProps {
  src?: string | null
  alt?: string
  className?: string
  fallback?: React.ReactNode
  aspectRatio?: 'square' | 'banner' | 'auto'
}

export function MediaRenderer({ 
  src, 
  alt = '', 
  className,
  fallback,
  aspectRatio = 'auto'
}: MediaRendererProps) {
  if (!src) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-zinc-800 text-gray-400',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'banner' && 'aspect-[3/1]',
        aspectRatio === 'auto' && 'aspect-video',
        className
      )}>
        {fallback || <ImageIcon className="w-8 h-8" />}
      </div>
    )
  }

  return (
    <div className={cn(
      'relative overflow-hidden bg-zinc-800',
      aspectRatio === 'square' && 'aspect-square',
      aspectRatio === 'banner' && 'aspect-[3/1]',
      aspectRatio === 'auto' && 'aspect-video',
      className
    )}>
      <ThirdwebMediaRenderer
        client={client}
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </div>
  )
}
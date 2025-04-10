'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

export interface ImageWithFallbackProps extends Omit<ImageProps, 'src'> {
  src: string
}

export default function ImageWithFallback({ src, alt, ...props }: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  return (
    <Image
      {...props}
      src={error ? '/placeholder.svg' : src}
      alt={alt}
      onError={() => setError(true)}
    />
  )
}

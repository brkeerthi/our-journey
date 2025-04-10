'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

const ImageWithFallback = (props: ImageProps) => {
  const { alt, src, ...rest } = props
  const [error, setError] = useState(false)

  return (
    <Image
      {...rest}
      src={error ? '/placeholder.svg' : src}
      alt={alt}
      onError={() => setError(true)}
    />
  )
}

export default ImageWithFallback

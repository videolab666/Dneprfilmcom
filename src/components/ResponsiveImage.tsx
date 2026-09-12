import type { ImgHTMLAttributes } from 'react';
import { imagePlaceholderUrl, responsiveImageSrcSet, responsiveImageUrl } from '../lib/responsiveImage';

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  displayWidth?: number;
}

export function ResponsiveImage({
  src,
  alt = '',
  sizes = '100vw',
  displayWidth = 1200,
  loading = 'lazy',
  decoding = 'async',
  style,
  ...props
}: ResponsiveImageProps) {
  const placeholder = imagePlaceholderUrl(src);
  const srcSet = responsiveImageSrcSet(src);
  const optimizedSrc = responsiveImageUrl(src, displayWidth);

  return (
    <img
      {...props}
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      style={{
        backgroundColor: '#e2e8f0',
        backgroundImage: placeholder ? `url(${placeholder})` : undefined,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        ...style,
      }}
    />
  );
}

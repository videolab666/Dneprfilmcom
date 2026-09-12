const CLOUDINARY_IMAGE_MARKER = '/image/upload/';

function insertCloudinaryTransform(url: string, transform: string): string {
  const index = url.indexOf(CLOUDINARY_IMAGE_MARKER);
  if (index < 0) return url;
  const prefix = url.slice(0, index + CLOUDINARY_IMAGE_MARKER.length);
  const rest = url.slice(index + CLOUDINARY_IMAGE_MARKER.length);
  return `${prefix}${transform}/${rest}`;
}

export function isCloudinaryImage(url: string): boolean {
  return Boolean(url) && url.includes('res.cloudinary.com') && url.includes(CLOUDINARY_IMAGE_MARKER);
}

export function responsiveImageUrl(url: string, width: number): string {
  if (!isCloudinaryImage(url)) return url;
  const safeWidth = Math.max(80, Math.round(width));
  return insertCloudinaryTransform(url, `f_auto,q_auto,c_limit,w_${safeWidth}`);
}

export function responsiveImageSrcSet(
  url: string,
  widths: number[] = [320, 480, 640, 768, 960, 1200, 1600, 2000, 2400],
): string | undefined {
  if (!isCloudinaryImage(url)) return undefined;
  return widths
    .map(width => `${responsiveImageUrl(url, width)} ${width}w`)
    .join(', ');
}

export function imagePlaceholderUrl(url: string): string | undefined {
  if (!isCloudinaryImage(url)) return undefined;
  return insertCloudinaryTransform(url, 'f_auto,q_20,c_limit,w_80,e_blur:600');
}

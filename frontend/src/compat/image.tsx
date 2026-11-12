import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
}

export default function Image({ fill, priority, unoptimized, className, style, ...props }: ImageProps) {
  const imageStyle: React.CSSProperties = {
    ...style,
    ...(fill
      ? {
          position: 'absolute',
          height: '100%',
          width: '100%',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          objectFit: 'cover',
        }
      : {}),
  };

  return (
    <img
      loading={priority ? 'eager' : 'lazy'}
      className={className}
      style={imageStyle}
      {...props}
    />
  );
}

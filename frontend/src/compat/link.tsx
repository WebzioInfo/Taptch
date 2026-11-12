import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname?: string; query?: Record<string, string> };
  children?: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export default function Link({ href, children, ...props }: LinkProps) {
  const to = typeof href === 'string' ? href : (href.pathname || '/');
  
  if (to.startsWith('http') || to.startsWith('mailto:') || to.startsWith('tel:')) {
    return <a href={to} {...props}>{children}</a>;
  }

  return <RouterLink to={to} {...props}>{children}</RouterLink>;
}


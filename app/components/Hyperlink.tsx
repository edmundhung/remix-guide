import type { ReactElement } from 'react';
import { Link } from 'remix';

interface HyperlinkProps {
  to: string;
  className?: string;
  children: ReactElement;
}

function Hyperlink({ to, className, children }: HyperlinkProps): ReactElement {
  const isAbsoluteURL =
    to.startsWith('https://') ||
    to.startsWith('http://') ||
    to.startsWith('//');

  if (isAbsoluteURL) {
    return (
      <a
        className={className}
        href={to}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={className} to={to} prefetch="intent">
      {children}
    </Link>
  );
}

export default Hyperlink;

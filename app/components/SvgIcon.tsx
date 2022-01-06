import type { ReactElement } from 'react';

interface SvgIconProps extends Partial<SVGElement> {
  href: string;
}

function SvgIcon({ href, ...rest }: SvgIconProps): ReactElement {
  return (
    <svg aria-hidden={true} role="img" {...rest}>
      <use href={`${href}#icon`} />
    </svg>
  );
}

export default SvgIcon;

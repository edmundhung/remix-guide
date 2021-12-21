import type { ReactElement } from 'react';
import SvgIcon from '~/components/SvgIcon';
import logo from '~/icons/logo.svg';

function Banner(): ReactElement {
  return (
    <div className="hidden h-full w-full md:flex flex-col items-center justify-center">
      <SvgIcon className="w-24 h-24" href={logo} />
      <h1 className="text-xl mt-6">Remix Guide</h1>
      <div className="pt-2 text-xs mb-6">
        Share with the community, by the community
      </div>
    </div>
  );
}

export default Banner;

import type { ReactElement } from 'react';
import SvgIcon from '~/components/SvgIcon';
import logo from '~/icons/logo.svg';

interface BannerProps {
  version?: string;
}

function Banner({ version }: BannerProps): ReactElement {
  return (
    <div className="hidden h-full w-full md:flex flex-col">
      <div className="flex flex-col flex-1 items-center justify-center">
        <SvgIcon className="w-20 h-20" href={logo} />
        <h1 className="text-xl mt-6">Remix Guide</h1>
        <div className="pt-2 text-xs">Sharing everything about Remix</div>
      </div>
      {version ? (
        <div className="p-6 text-center text-xs text-gray-500">
          Version{' '}
          <a
            className="hover:underline"
            href="https://github.com/edmundhung/remix-guide"
            target="_blank"
            rel="noopener noreferrer"
          >
            {version}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default Banner;

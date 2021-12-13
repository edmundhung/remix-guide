import { ReactElement } from 'react';
import SvgIcon from '~/components/SvgIcon';
import tutorialscon from '~/icons/chalkboard-teacher.svg';
import conceptsIcon from '~/icons/coffee.svg';
import packagesIcon from '~/icons/box-open.svg';
import templatesIcon from '~/icons/paste.svg';
import examplesIcon from '~/icons/map-signs.svg';
import othersIcon from '~/icons/mail-bulk.svg';

interface CategoryIconProps {
  category: string;
  fallback?: boolean;
}

function CategoryIcon({
  category,
  fallback,
}: CategoryIconProps): ReactElement | null {
  let iconUrl: string | null = null;

  switch (category) {
    case 'concepts':
      iconUrl = conceptsIcon;
      break;
    case 'tutorials':
      iconUrl = tutorialscon;
      break;
    case 'packages':
      iconUrl = packagesIcon;
      break;
    case 'templates':
      iconUrl = templatesIcon;
      break;
    case 'examples':
      iconUrl = examplesIcon;
      break;
    case 'others':
      iconUrl = othersIcon;
      break;
  }

  if (!iconUrl) {
    return <i className="inline-block w-4 h-4" />;
  }

  return <SvgIcon className="inline-block w-4 h-4" href={iconUrl} />;
}

export default CategoryIcon;

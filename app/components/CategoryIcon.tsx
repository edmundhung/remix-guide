import { ReactElement } from 'react';
import SvgIcon from '~/components/SvgIcon';
import articleIcon from '~/icons/article.svg';
import videoIcon from '~/icons/video.svg';
import packageIcon from '~/icons/package.svg';
import templateIcon from '~/icons/template.svg';
import exampleIcon from '~/icons/example.svg';

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
    case 'articles':
      iconUrl = articleIcon;
      break;
    case 'videos':
      iconUrl = videoIcon;
      break;
    case 'packages':
      iconUrl = packageIcon;
      break;
    case 'templates':
      iconUrl = templateIcon;
      break;
    case 'examples':
      iconUrl = exampleIcon;
      break;
  }

  if (!iconUrl) {
    return <i className="inline-block w-4 h-4" />;
  }

  return <SvgIcon className="inline-block w-4 h-4" href={iconUrl} />;
}

export default CategoryIcon;

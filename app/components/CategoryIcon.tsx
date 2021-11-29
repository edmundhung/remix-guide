import { ReactElement } from 'react';
import { Article as ArticleIcon } from '~/icons/article';
import { Video as VideoIcon } from '~/icons/video';
import { Package as PackageIcon } from '~/icons/package';
import { Template as TemplateIcon } from '~/icons/template';
import { Example as ExampleIcon } from '~/icons/example';

interface CategoryIconProps {
  category: string;
  fallback?: boolean;
}

function CategoryIcon({
  category,
  fallback,
}: CategoryIconProps): ReactElement | null {
  switch (category) {
    case 'articles':
      return <ArticleIcon className="inline-block w-4 h-4" />;
    case 'videos':
      return <VideoIcon className="inline-block w-4 h-4" />;
    case 'packages':
      return <PackageIcon className="inline-block w-4 h-4" />;
    case 'templates':
      return <TemplateIcon className="inline-block w-4 h-4" />;
    case 'examples':
      return <ExampleIcon className="inline-block w-4 h-4" />;
    default:
      return fallback ? <i className="inline-block w-4 h-4" /> : null;
  }
}

export default CategoryIcon;

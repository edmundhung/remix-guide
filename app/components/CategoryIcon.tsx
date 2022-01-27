import { ReactElement } from 'react';
import SvgIcon from '~/components/SvgIcon';
import packageIcon from '~/icons/box-open.svg';
import repositoryIcon from '~/icons/map-signs.svg';
import othersIcon from '~/icons/mail-bulk.svg';

interface CategoryIconProps {
	category: string;
}

function CategoryIcon({ category }: CategoryIconProps): ReactElement | null {
	let iconUrl: string | null = null;

	switch (category) {
		case 'package':
			iconUrl = packageIcon;
			break;
		case 'repository':
			iconUrl = repositoryIcon;
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

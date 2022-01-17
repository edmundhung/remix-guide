import type { ReactElement } from 'react';
import type { MessageType } from '~/types';
import { useEffect, useState } from 'react';
import SvgIcon from '~/components/SvgIcon';
import timesIcon from '~/icons/times.svg';
import checkCircleIcon from '~/icons/check-circle.svg';
import timesCircleIcon from '~/icons/times-circle.svg';
import exclamationCircleIcon from '~/icons/exclamation-circle.svg';
import infoCircleIcon from '~/icons/info-circle.svg';

function formatMessage(message: string): ReactElement {
	const [type, content] = message.split(':');
	let icon: string | null = null;

	switch (type.trim() as MessageType) {
		case 'success':
			icon = checkCircleIcon;
			break;
		case 'error':
			icon = timesCircleIcon;
			break;
		case 'info':
			icon = infoCircleIcon;
			break;
		case 'warning':
			icon = exclamationCircleIcon;
			break;
	}

	return (
		<>
			{!icon ? null : <SvgIcon className="inline-block w-4 h-4" href={icon} />}
			<span>{content.trim()}</span>
		</>
	);
}

interface FlashMessageProps {
	message: string | null;
}

function FlashMessage({ message }: FlashMessageProps): ReactElement | null {
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		setDismissed(false);
	}, [message]);

	if (!message || dismissed) {
		return null;
	}

	return (
		<div className="flex items-center gap-4 bg-gray-700 px-5 py-3 text-sm">
			<div className="flex items-center flex-1 py-1 gap-4">
				{formatMessage(message)}
			</div>
			<button type="button" onClick={() => setDismissed(true)}>
				<SvgIcon className="w-3 h-3" href={timesIcon} />
			</button>
		</div>
	);
}

export default FlashMessage;

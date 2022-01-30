import {
	LoaderFunction,
	ShouldReloadFunction,
	MetaFunction,
	useLoaderData,
} from 'remix';
import { json } from 'remix';
import About from '~/components/About';
import BookmarkDetails from '~/components/BookmarkDetails';
import SuggestedBookmarks from '~/components/SuggestedBookmarks';
import { capitalize, formatMeta, notFound } from '~/helpers';
import { getSuggestions } from '~/bookmarks';
import { Bookmark, Context, SearchOptions, User } from '~/types';

interface LoaderData {
	bookmark: Bookmark;
	user: User | null;
	suggestions: Array<{
		bookmarks: Bookmark[];
		searchOptions: SearchOptions;
	}>;
}

export let meta: MetaFunction = ({ data, params }) => {
	const { list, guide } = params;

	if (!list || !guide) {
		return {};
	}

	return formatMeta({
		title: capitalize(list),
		description: data?.resource?.description ?? '',
		'og:url': `https://remix.guide/${guide}/${list}`,
	});
};

export let loader: LoaderFunction = async ({ context, params, request }) => {
	if (params.list !== 'history' && params.list !== 'bookmarks') {
		throw notFound();
	}

	const url = new URL(request.url);
	const bookmarkId = url.searchParams.get('bookmarkId');

	if (!bookmarkId) {
		return json({});
	}

	const { session, store } = context as Context;
	const [bookmarks, user] = await Promise.all([
		store.getBookmarks('news'),
		(async () => {
			const profile = await session.isAuthenticated();

			if (!profile) {
				return null;
			}

			return await store.getUser(profile.id);
		})(),
	]);
	const bookmark = bookmarks.find((bookmark) => bookmark.id === bookmarkId);

	if (!bookmark) {
		throw notFound();
	}

	return json({
		user,
		bookmark,
		suggestions: getSuggestions(bookmarks, bookmark),
	});
};

export const unstable_shouldReload: ShouldReloadFunction = ({
	prevUrl,
	url,
	submission,
}) => {
	if (
		prevUrl.searchParams.get('bookmarkId') !==
		url.searchParams.get('bookmarkId')
	) {
		return true;
	}

	return ['bookmark', 'unbookmark'].includes(
		submission?.formData.get('type')?.toString() ?? '',
	);
};

export default function UserProfile() {
	const { bookmark, user, suggestions } = useLoaderData<LoaderData>();

	if (!bookmark) {
		return <About />;
	}

	return (
		<BookmarkDetails bookmark={bookmark} user={user}>
			{suggestions.map(({ bookmarks, searchOptions }) => (
				<SuggestedBookmarks
					key={JSON.stringify(searchOptions)}
					bookmarks={bookmarks}
					searchOptions={searchOptions}
				/>
			))}
		</BookmarkDetails>
	);
}

import { Form, Link } from 'remix';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import SvgIcon from '~/components/SvgIcon';
import backIcon from '~/icons/back.svg';
import timesIcon from '~/icons/times.svg';
import { categories, integrations, platforms } from '~/config';
import {
	PaneContainer,
	PaneHeader,
	PaneContent,
	List,
	PaneFooter,
} from '~/layout';
import { SearchOptions } from '~/types';
import { getAction, getResourceSearchParams } from '~/search';

interface SearchListProps {
	searchOptions: SearchOptions;
	selectedResourceId: string | null | undefined;
}

interface InputOptionProps {
	type: 'radio' | 'checkbox';
	label?: string;
	name: string;
	value?: string | null;
	checked: boolean;
}

function InputOption({ type, label, name, value, checked }: InputOptionProps) {
	const id = `${name}-${value ?? 'any'}`;

	return (
		<label
			htmlFor={id}
			className="cursor-pointer px-3 py-1.5 flex items-center gap-4"
		>
			<input
				id={id}
				className="h-4 w-4 border-gray-300 rounded text-blue-500 focus:ring-blue-500 ring-blue-500"
				type={type}
				name={name}
				value={value ?? ''}
				defaultChecked={checked}
			/>
			{label ?? value ?? ''}
		</label>
	);
}

function SearchList({ searchOptions, selectedResourceId }: SearchListProps) {
	const ref = useRef<HTMLInputElement>(null);
	const [keyword, setKeyword] = useState(searchOptions.keyword ?? '');

	return (
		<Form action={getAction(searchOptions, selectedResourceId)}>
			<PaneContainer>
				<PaneHeader padding="minimum">
					<div className="relative w-full flex items-center">
						<Link
							className="z-10 absolute left-2"
							to={
								searchOptions.list
									? selectedResourceId
										? `?resourceId=${selectedResourceId}`
										: '?'
									: `?${getResourceSearchParams({
											list: searchOptions.list,
											category: searchOptions.category,
									  })}`
							}
						>
							<span className="flex items-center justify-center w-6 h-6">
								<SvgIcon className="w-4 h-4" href={backIcon} />
							</span>
						</Link>
						<input
							ref={ref}
							className="h-10 flex-1 px-9 py-2 bg-gray-900 text-gray-200 border rounded-lg border-gray-600 focus:border-white focus:ring-0"
							type="text"
							name="q"
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							placeholder="Keywords"
							autoFocus
						/>
						<button
							type="button"
							className={clsx('z-10 absolute right-2', {
								invisible: keyword.trim() === '',
							})}
							onClick={() => {
								setKeyword('');
								ref.current?.focus();
							}}
						>
							<span className="flex items-center justify-center w-6 h-6">
								<SvgIcon className="w-4 h-4" href={timesIcon} />
							</span>
						</button>
					</div>
				</PaneHeader>
				<PaneContent>
					<List title="Category">
						<div className="grid grid-cols-2 gap-1 capitalize">
							<div className="col-span-2 normal-case">
								<InputOption
									type="radio"
									name="category"
									label="Any category"
									checked={!searchOptions.category}
								/>
							</div>
							{categories.map((option) => (
								<InputOption
									key={option}
									type="radio"
									name="category"
									value={option}
									checked={option === searchOptions.category}
								/>
							))}
						</div>
					</List>
					<List title="Platform">
						<div className="grid grid-cols-2 gap-1">
							<div className="col-span-2">
								<InputOption
									type="radio"
									name="platform"
									label="Any platform"
									checked={!searchOptions.platform}
								/>
							</div>
							{platforms.map((option) => (
								<InputOption
									key={option}
									type="radio"
									name="platform"
									value={option}
									checked={option === searchOptions.platform}
								/>
							))}
						</div>
					</List>
					<List title="Integration">
						<div className="grid grid-cols-2 gap-1">
							{Array.from(
								new Set([
									...integrations,
									...(searchOptions.integrations ?? []),
								]),
							).map((option) => (
								<InputOption
									key={option}
									type="checkbox"
									name="integration"
									value={option}
									checked={
										searchOptions.integrations?.includes(option) ?? false
									}
								/>
							))}
						</div>
					</List>
					{searchOptions.author ? (
						<List title="Author">
							<div className="grid grid-cols-2 gap-1">
								<InputOption
									type="checkbox"
									name="author"
									value={searchOptions.author}
									checked
								/>
							</div>
						</List>
					) : null}
					{searchOptions.site ? (
						<List title="Site">
							<div className="grid grid-cols-2 gap-1">
								<InputOption
									type="checkbox"
									name="site"
									value={searchOptions.site}
									checked
								/>
							</div>
						</List>
					) : null}
				</PaneContent>
				<PaneFooter padding="minimum">
					<div className="py-3 ">
						<button
							type="submit"
							className="w-full drop-shadow-lg p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
						>
							Search
						</button>
					</div>
				</PaneFooter>
			</PaneContainer>
		</Form>
	);
}

export default SearchList;

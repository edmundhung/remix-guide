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
import { getSearchOptions } from '~/search';

interface SearchListProps {
  searchParams: URLSearchParams;
}

interface InputOptionProps {
  type: 'radio' | 'checkbox';
  name: string;
  value?: string | null;
  checked: boolean;
}

function InputOption({ type, name, value, checked }: InputOptionProps) {
  const id = `${name}-${value ?? 'any'}`;

  return (
    <label
      htmlFor={id}
      className="cursor-pointer px-3 py-1.5 flex items-center gap-4"
    >
      <input
        id={id}
        type={type}
        name={name}
        value={value ?? ''}
        defaultChecked={checked}
      />
      {value ?? `Any ${name}`}
    </label>
  );
}

function SearchList({ searchParams }: SearchListProps) {
  const ref = useRef<HTMLInputElement>(null);
  const searchOptions = getSearchOptions(searchParams);
  const [keyword, setKeyword] = useState(searchOptions.keyword ?? '');

  return (
    <Form action="/resources">
      <PaneContainer>
        <PaneHeader padding="minimum">
          <div className="relative w-full flex items-center">
            <Link
              className="z-10 absolute left-3"
              to={
                searchOptions.list
                  ? `?${new URLSearchParams({
                      list: searchOptions.list,
                    }).toString()}`
                  : '/'
              }
            >
              <span className="flex items-center justify-center w-5 h-5">
                <SvgIcon className="w-3 h-3" href={backIcon} />
              </span>
            </Link>
            <input
              ref={ref}
              className="h-10 flex-1 px-9 py-2 bg-gray-900 text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
              type="text"
              name="q"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Keywords"
              autoFocus
            />
            <button
              type="button"
              className={clsx('z-10 absolute right-3', {
                invisible: keyword.trim() === '',
              })}
              onClick={() => {
                setKeyword('');
                ref.current?.focus();
              }}
            >
              <span className="flex items-center justify-center w-5 h-5">
                <SvgIcon className="w-3 h-3" href={timesIcon} />
              </span>
            </button>
          </div>
        </PaneHeader>
        <PaneContent>
          <List title="List">
            <div className="grid grid-cols-2 gap-1 capitalize">
              {['discover', 'bookmarks', 'history'].map((option) => (
                <InputOption
                  key={option}
                  type="radio"
                  name="list"
                  value={option}
                  checked={
                    option === searchOptions.list ||
                    (option === 'discover' && searchOptions.list === null)
                  }
                />
              ))}
            </div>
          </List>
          <List title="Category">
            <div className="grid grid-cols-2 gap-1 capitalize">
              <div className="col-span-2">
                <InputOption
                  type="radio"
                  name="category"
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
            <div className="columns-2">
              {integrations.map((option) => (
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
        </PaneContent>
        <PaneFooter padding="minimum">
          <div className="py-3">
            <button
              type="submit"
              className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
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

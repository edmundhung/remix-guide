import { ReactElement, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Link, useSubmit, useTransition } from 'remix';
import { capitalize, throttle } from '~/helpers';

interface SearchFormProps {
  categories: string[];
  platforms: string[];
  versions: string[];
  languages: string[];
}

interface SearchLinkProps {
  name: string;
  value: string;
  children: string;
}

function SearchLink({ name, value, children }: SearchLinkProps): ReactElement {
  const [searchParams] = useSearchParams();
  const isActive = searchParams.get(name) === value;
  const search = new URLSearchParams(searchParams);

  if (!isActive) {
    search.set(name, value);
  } else {
    search.delete(name);
  }

  return (
    <Link
      className={`px-2 transition-colors ${
        isActive ? 'text-gray-900' : 'text-gray-300'
      } hover:text-gray-600`}
      to={`/search?${search.toString()}`}
      prefetch="intent"
    >
      {children}
    </Link>
  );
}

function SearchForm({
  categories,
  platforms,
  versions,
  languages,
}: SearchFormProps): ReactElement {
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const transition = useTransition();
  const keyword = searchParams.get('q');
  const category = searchParams.get('category');
  const version = searchParams.get('version') ?? '';
  const platform = searchParams.get('platform') ?? '';
  const language = searchParams.get('language') ?? '';
  const handleSubmit = useMemo(() => throttle(submit, 200), [submit]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (
      transition.state === 'loading' &&
      transition.type === 'normalLoad' &&
      transition.location.pathname !== '/search'
    ) {
      formRef.current.reset();
    }
  }, [transition]);

  function handleChange(event) {
    handleSubmit(event.currentTarget);
  }

  return (
    <Form
      className="sm:px-5 lg:px-10 flex flex-grow flex-col lg:flex-row"
      method="get"
      action="/search"
      ref={formRef}
      onChange={handleChange}
    >
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <div className="relative flex-grow color-gray-300">
        <div className="flex items-center flex-row-reverse">
          <input
            id="search"
            className="h-12 sm:h-auto w-full pr-4 pl-9 py-2 text-gray-700 border-b focus:outline-none focus:border-gray-700 appearance-none"
            type="text"
            name="q"
            defaultValue={keyword ?? ''}
            autoFocus
            placeholder="Search"
          />
          <label htmlFor="search" className="-mr-7">
            <svg
              className="w-5 h-5 fill-current text-gray-500 z-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="black"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </label>
        </div>
      </div>
      <div className="hidden sm:flex flex-col sm:flex-row items-center pt-2">
        <div className="flex flex-row lg:px-10">
          {versions.length === 0 ? null : (
            <select
              className={`px-2 text-center ${
                version !== '' ? 'text-gray-900' : 'text-gray-300'
              } hover:text-gray-600 transition-colors cursor-pointer appearance-none`}
              name="version"
              defaultValue={version}
            >
              <option value="">Version</option>
              {versions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          )}
          {platforms.length === 0 ? null : (
            <select
              className={`px-2 text-center ${
                platform !== '' ? 'text-gray-900' : 'text-gray-300'
              } hover:text-gray-600 transition-colors cursor-pointer appearance-none`}
              name="platform"
              defaultValue={platform}
            >
              <option value="">Platform</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          )}
          {languages.length === 0 ? null : (
            <select
              className={`px-2 text-center ${
                language !== '' ? 'text-gray-900' : 'text-gray-300'
              } hover:text-gray-600 transition-colors cursor-pointer appearance-none`}
              name="language"
              defaultValue={language}
            >
              <option value="">Language</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          )}
        </div>
        <nav className="flex-grow sm:text-right">
          {categories.map((category) => (
            <SearchLink key={category} name="category" value={category}>
              {capitalize(category)}
            </SearchLink>
          ))}
        </nav>
      </div>
    </Form>
  );
}

export default SearchForm;

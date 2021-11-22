import { ReactElement, useEffect, useMemo, useRef } from 'react';
import { Form, Link, useSubmit, useTransition, useSearchParams } from 'remix';
import { capitalize, throttle } from '~/helpers';

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
        isActive
          ? 'text-gray-900 dark:text-gray-200'
          : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
      }`}
      to={`/search?${search.toString()}`}
      prefetch="intent"
    >
      {children}
    </Link>
  );
}

function Select({ name, value, children }: SelectProps): ReactElement {
  return (
    <select
      className={`dark:bg-black mx-1 px-2 text-center ${
        value !== ''
          ? 'text-gray-900 dark:text-gray-200 border-gray-700 dark:border-white'
          : 'text-gray-400 dark:text-gray-600 border-white dark:border-black hover:text-gray-600 dark:hover:text-gray-400'
      } transition-colors border appearance-none outline-none`}
      name={name}
      defaultValue={value}
    >
      {children}
    </select>
  );
}

interface SelectProps {
  name: string;
  value: string;
  children: ReactElement;
}

interface SearchFormProps {
  categories: string[];
  platforms: string[];
  versions: string[];
  languages: string[];
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
      className="flex flex-grow flex-row"
      method="get"
      action="/search"
      ref={formRef}
      onChange={handleChange}
    >
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <div className="px-4 relative flex-grow">
        <div className="flex items-center flex-row-reverse">
          <input
            id="search"
            className="h-12 w-full pr-4 pl-9 py-2 dark:bg-black text-gray-700 dark:text-gray-200 border-b dark:border-b-gray-600 focus:outline-none focus:border-gray-700 dark:focus:border-white focus:border-white appearance-none"
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
      <div className="flex flex-row items-center">
        <div className="hidden lg:flex flex-row lg:pr-6">
          {versions.length === 0 ? null : (
            <Select name="version" value={version}>
              <option value="">Version</option>
              {versions.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </Select>
          )}
          {platforms.length === 0 ? null : (
            <Select name="platform" value={platform}>
              <option value="">Platform</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </Select>
          )}
          {languages.length === 0 ? null : (
            <Select name="language" value={language}>
              <option value="">Language</option>
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </Select>
          )}
        </div>
        <nav className="hidden sm:block flex-grow sm:text-right">
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

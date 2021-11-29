import { ReactElement, ReactNode } from 'react';

interface ListProps {
  title: string;
  children: ReactNode;
}

function List({ title, children }: ListProps): ReactElement {
  return (
    <section className="w-full h-full max-h-screen overflow-y-auto border-r">
      <header className="sticky top-0 backdrop-blur z-20 px-8 py-4 text-sm border-b">
        {title}
      </header>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

export default List;

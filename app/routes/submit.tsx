import Panel from '~/components/Panel';

export default function Submit() {
  return (
    <Panel title="Submission">
      <section className="px-8 pt-8">
        <div className="prose-sm">
          <h1>Contributing</h1>
          <p className="py-4">
            Hello! Thanks for your interest in contributing to Remix Guide.
          </p>
          <p>
            We would love to collect your submission with a simple interface
            here. But we are not there yet.
          </p>
          <p>
            For now, all the contents are managed within our{' '}
            <a
              className="underline"
              href="https://github.com/edmundhung/remix-guide"
            >
              GitHub repository
            </a>{' '}
            under the `content` directory.
          </p>
          <p>
            Please take a reference from existing content and create a Pull
            Request with your submission details.
          </p>
          <p>We will publish it as soon as possible.</p>
          <p className="py-4">Thank you.</p>
        </div>
      </section>
    </Panel>
  );
}

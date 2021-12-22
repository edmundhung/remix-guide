# remix-guide

Remix Guide is a platform for sharing everything about Remix. It is built with [Remix](https://docs.remix.run) and is deployed to [Cloudflare Workers](https://workers.cloudflare.com/). All contents are published to Worker KV and Durable Objects.

## Roadmap

The idea behind Remix Guide is to make all resources prepared by the community more accessible and making the whole process as automatic as possible. Furture plans include:

- Online submission
- Voting system
- Better search ranking / recommendations
- Github repository analysis (e.g. Check package.json for packages and versions used)

## Submission

All the contents are currently managed under the `content` directory. Please take a reference from existing content and create a Pull Request with your submission details.

We will publish it as soon as possible.

## Node Version

Please make sure the node version is **>= 16.7**. If you are using `nvm`, just run:

```sh
nvm use
```

This allows [miniflare](https://github.com/cloudflare/miniflare) to serve a development environment as close to the actual worker runtime as possibile.

## Development

To starts your app in development mode, rebuilding assets on file changes, the recommended approach is:

```sh
npm run dev
```

This will run your remix app in dev mode using miniflare with the Cypress test runner opened.

## Deployment

First, preview your app with:

```sh
npx wrangler preview
```

When confirmed everythings works, deploy the worker with Wrangler using:

```sh
npx wrangler publish
```

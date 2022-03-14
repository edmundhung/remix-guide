# remix-guide

Remix Guide is a platform for sharing everything about Remix. It is built with [Remix](https://remix.run) and is deployed to [Cloudflare Workers](https://workers.cloudflare.com/). All contents are saved in Durable Objects and cached with Worker KV.

## Roadmap

The idea behind Remix Guide is to make resources from the community more accessible and making the process as automatic as possible at the same time. Future plans include:

- Make and share your own list
- Better search ranking / recommendations
- Support searching by language and version (remix and packages)

## Submission

As of v1.0, new resources can only be submitted online. There are some basic validations in place to ensure the submitted URL is relevant to remix. However, in order to minimize the risk of spamming or phishing, additional measures have to be added before it is generally available.

If you would like to submit new content, feel free to share them on the `#showcase` channel of the [Remix Discord](https://discord.com/invite/remix). We are watching the channel and will publish anything shared there as soon as possible.

## Development

To run Remix Guide locally, please make a `.env` file based on `.env.example` first. You can then start the app in development mode using:

```sh
npm run dev
```

This should kickstart a dev server and open the webpage on the browser automatically.

## Node Version

Please make sure the node version is **>= 16.7**. If you are using `nvm`, simply run:

```sh
nvm use
```

This allows [miniflare](https://github.com/cloudflare/miniflare) to serve a development environment as close to the actual worker runtime as possibile.

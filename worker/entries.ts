const entries = [
  {
    slug: 'edmund-deploying-remix-app-on-cloudflare-workers',
    url: 'https://edmund.dev/articles/deploying-remix-app-on-cloudflare-workers',
    category: 'articles',
    title: 'Deploying Remix app on Cloudflare Workers',
    description:
      'Step by step guide on how to deploy your remix app to Cloudflare Workers using the `remix-worker-template`',
  },
  {
    slug: 'remix-auth',
    category: 'packages',
    url: 'https://github.com/sergiodxa/remix-auth',
    title: 'sergiodxa/remix-auth',
    description: 'Simple Authentication for Remix',
    image:
      'https://opengraph.githubassets.com/cc065fe3e90866b296b5f71883049444d33061c8f2ae1ec6811093c84513b6f8/sergiodxa/remix-auth',
  },
  {
    slug: 'remix-utils',
    category: 'packages',
    url: 'https://github.com/sergiodxa/remix-utils',
    title: 'sergiodxa/remix-utils',
    description: 'A set of utility functions and types to use with Remix.run',
    image:
      'https://opengraph.githubassets.com/abc6efa8565efad8518a3991abad47a20558f72a0bcb1ee2180f17f9506330ce/sergiodxa/remix-utils',
  },
  {
    slug: 'remix-i18next',
    category: 'packages',
    url: 'https://github.com/sergiodxa/remix-i18next',
    title: 'sergiodxa/remix-i18next',
    description: 'The easiest way to translate your Remix apps',
    image:
      'https://opengraph.githubassets.com/c60e70ebf2d8087d468db97cfd929688cf75e7dfd6cf1ba3f956f9d0b1539f36/sergiodxa/remix-i18next',
  },
  {
    slug: 'remix-seo',
    category: 'packages',
    url: 'https://github.com/chaance/remix-seo',
    title: 'chaance/remix-seo',
    description:
      'A package for easily managing SEO meta and link tags in Remix.',
    image:
      'https://opengraph.githubassets.com/9b9140f8517b2a46c081d7065717ba119efb2adcfcf0bbafcaed8fac2d860761/chaance/remix-seo',
  },
  {
    slug: 'danielgary-remix-azure-template',
    category: 'templates',
    url: 'https://github.com/danielgary/remix-azure-template',
    title: 'danielgary/remix-azure-template',
    image:
      'https://opengraph.githubassets.com/4f1a248f35414f4bfdccb2caf76bb0ca57900d53dccadec9d884ae821ae920d9/danielgary/remix-azure-template',
  },
  {
    slug: 'brookslybrand-remix-nested-layouts',
    category: 'templates',
    url: 'https://github.com/brookslybrand/remix-nested-layouts',
    title: 'brookslybrand/remix-nested-layouts',
    description: 'Converting a demo of implementing nested layouts in Next.js',
    image:
      'https://opengraph.githubassets.com/b79a213f7e3907d1530f4d3a52c1bcbd74a688ddab077e61c883b4538074ec7a/brookslybrand/remix-nested-layouts',
  },
  {
    slug: 'mcansh-remix-tailwind-starter',
    category: 'templates',
    url: 'https://github.com/mcansh/remix-tailwind-starter',
    title: 'mcansh/remix-tailwind-starter',
    description:
      'A Remix.run starter with tailwindcss configured and deployed to various cloud platforms',
    image:
      'https://opengraph.githubassets.com/7ad8248d4f7b82b5409c2767791024c169091658688b49348832c133fc8fce2e/mcansh/remix-tailwind-starter',
  },
  {
    slug: 'ascorbic-remix-on-netlify',
    category: 'templates',
    url: 'https://github.com/ascorbic/remix-on-netlify',
    title: 'ascorbic/remix-on-netlify',
    image:
      'https://opengraph.githubassets.com/17c30e7001b7fc25f644993b96f49d52a3e3764ef2096da1a841d76e3055f515/ascorbic/remix-on-netlify',
  },
  {
    slug: 'jacob-ebey-remix-css-modules',
    category: 'templates',
    url: 'https://github.com/jacob-ebey/remix-css-modules',
    title: 'jacob-ebey/remix-css-modules',
    description: 'Example of using CSS modules with Remix.run',
    image:
      'https://opengraph.githubassets.com/33d74b96a4039c6fbd3fa3d4f5f2aa84700e92accdef1ffad501d541926af42d/jacob-ebey/remix-css-modules',
  },
  {
    slug: 'jacob-ebey-remix-auth-layouts-example',
    category: 'templates',
    url: 'https://github.com/jacob-ebey/remix-auth-layouts-example',
    title: 'jacob-ebey/remix-auth-layouts-example',
    description:
      'An example showing how to build a simple login flow utilizing actions, transitions, layout routes and more that works with and without JavaScript enabled.',
    image:
      'https://opengraph.githubassets.com/1dc32b022849cb4cfc913a873f9e857f693835332d0cd056c758d710ad50aaa4/jacob-ebey/remix-auth-layouts-example',
  },
  {
    slug: 'edmundhung-remix-worker-template',
    category: 'templates',
    url: 'https://github.com/edmundhung/remix-worker-template',
    title: 'edmundhung/remix-worker-template',
    description:
      '📜 Starter template for setting up a Remix app on Cloudflare Workers',
    image:
      'https://opengraph.githubassets.com/b1a2979fce1c95f549d25b7094e1790d4504fd4572d35c3fba8638a463f963ae/edmundhung/remix-worker-template',
  },
  {
    slug: 'kentcdodds-kentcdodds.com',
    category: 'others',
    url: 'https://github.com/kentcdodds/kentcdodds.com',
    title: 'kentcdodds/kentcdodds.com',
    description: 'My personal website',
    image:
      'https://opengraph.githubassets.com/f1604576f571396a1de0804d85ef6538638133b612124e9aebfb13ca18ba65a9/kentcdodds/kentcdodds.com',
  },
  {
    slug: 'HovaLabs-hova-labs-remix',
    category: 'others',
    url: 'https://github.com/HovaLabs/hova-labs-remix',
    title: 'HovaLabs/hova-labs-remix',
    image:
      'https://opengraph.githubassets.com/e07efc219fb41b233bf314de5d8d844ea8d4bb849f7c45c7c307b4956651c367/HovaLabs/hova-labs-remix',
  },
  {
    slug: 'mcansh-snkrs',
    category: 'others',
    url: 'https://github.com/mcansh/snkrs',
    title: 'mcansh/snkrs',
    description: 'show off your sneaker collection',
    image:
      'https://opengraph.githubassets.com/78ee9dfc88d2acf3256e9a261e77b3388e9e60ae8001888483ebe22520e85dd4/mcansh/snkrs',
  },
  {
    slug: 'BenoitAverty-realworld-remix.run',
    category: 'others',
    url: 'https://github.com/BenoitAverty/realworld-remix.run',
    title: 'BenoitAverty/realworld-remix.run',
    description: 'Remix.run implementation of Conduit',
    image:
      'https://opengraph.githubassets.com/5e297735aef04fe91f0119a7d3926284e5166df42ad569813e1ce7669fad01ee/BenoitAverty/realworld-remix.run',
  },
  {
    slug: 'camchenry-camchenry-remix',
    category: 'others',
    url: 'https://github.com/camchenry/camchenry-remix',
    title: 'camchenry/camchenry-remix',
    image:
      'https://opengraph.githubassets.com/2591b07762a32fb84ea62790789c160cb64b258f5e1bbf79355f8f0d98e4e509/camchenry/camchenry-remix',
  },
  {
    slug: 'sergiodxa-personal-site',
    category: 'others',
    url: 'https://github.com/sergiodxa/personal-site',
    title: 'sergiodxa/personal-site',
    description: 'Personal website',
    image:
      'https://repository-images.githubusercontent.com/34244035/e3254a80-8313-11e9-807c-f737369e6ab7',
  },
  {
    slug: 'cdn-caching-static-site-generation-and-server-side-rendering',
    category: 'videos',
    url: 'https://www.youtube.com/watch?v=bfLFHp7Sbkg',
    title: 'CDN Caching, Static Site Generation, and Server Side Rendering',
    description:
      'Remix relies on CDNs and cache control headers to get the best web performance possible. Here we’ll compare various caching strategies, including Static Site...',
    image: 'https://i.ytimg.com/vi/bfLFHp7Sbkg/maxresdefault.jpg',
  },
  {
    slug: 'document-titles-in-remix',
    category: 'videos',
    url: 'https://www.youtube.com/watch?v=nXjMorEABFQ',
    title: 'Document Titles in Remix',
    description:
      'Quick look at how Remix handles the ever-important document title and other items in the head of a document.',
    image: 'https://i.ytimg.com/vi/nXjMorEABFQ/maxresdefault.jpg',
  },
  {
    slug: 'live-with-kent-building-authentication-with-postgres-prisma-and-remix',
    category: 'videos',
    url: 'https://www.youtube.com/watch?v=XkZINZDDdms',
    title:
      'Live with Kent: Building Authentication with Postgres, Prisma, and Remix',
    description: '',
    image: 'https://i.ytimg.com/vi/XkZINZDDdms/maxresdefault.jpg',
  },
  {
    slug: 'progressive-enhancement-with-Remix',
    category: 'videos',
    url: 'https://www.youtube.com/watch?v=VM4VMESF3tU',
    title: 'Progressive Enhancement with Remix',
    description:
      "Remix makes progressively enhancing web sites/web apps incredibly simple. With it\\'s platform-first focus you can easily make the same site to work with or wi...",
    image: 'https://i.ytimg.com/vi/VM4VMESF3tU/hqdefault.jpg',
  },
  {
    slug: 'how-to-add-nested-persistent-layouts-in-remix',
    category: 'videos',
    url: 'https://www.youtube.com/watch?v=2QlxdDGqJ2c',
    title: 'How to Add Nested/Persistent Layouts in Remix',
    description:
      'In this video take a previous demo I created showing how to add nested/persistent layouts in Next.js and show how to accomplish the same thing in Remix.You c...',
    image: 'https://i.ytimg.com/vi/2QlxdDGqJ2c/maxresdefault.jpg',
  },
  {
    slug: 'introduction-to-http-caching',
    category: 'videos',
    url: 'https://www.youtube.com/watch?v=3XkU_DXcgl0',
    title: 'Remix Run - Introduction to HTTP Caching',
    description:
      'HTTP Caching is a web fundamental every web developer should eventually learn. The quickest way to a slow website is to not understand caching and ofc, the b...',
    image: 'https://i.ytimg.com/vi/3XkU_DXcgl0/hqdefault.jpg',
  },
  {
    slug: 'kentcdodds-how-remix-makes-css-clashes-predictable',
    category: 'articles',
    url: 'https://kentcdodds.com/blog/how-remix-makes-css-clashes-predictable',
    title: 'How Remix makes CSS clashes predictable',
    description:
      'Remix has this beautifully simple feature for CSS that I want to tell you all about.',
    image:
      'https://kentcdodds.com/img/social?type=2&title=How+Remix+makes+CSS+clashes+predictable&preTitle=Checkout+this+article&img=unsplash%2Fphoto-1543393716-375f47996a77&url=kentcdodds.com%2Fblog%2Fhow-remix-makes-css-clashes-predictable',
  },
  {
    slug: 'kentcdodds-super-simple-start-to-remix',
    category: 'articles',
    url: 'https://kentcdodds.com/blog/super-simple-start-to-remix',
    title: 'Super Simple Start to Remix',
    description: 'The simplest distraction-free version of a remix app',
    image:
      'https://kentcdodds.com/img/social?type=2&title=Super+Simple+Start+to+Remix&preTitle=Checkout+this+article&img=unsplash%2Fphoto-1609667083964-f3dbecb7e7a5&url=kentcdodds.com%2Fblog%2Fsuper-simple-start-to-remix',
  },
  {
    slug: 'sergiodxa-use-etags-in-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/use-etags-in-remix',
    title: 'Use ETags in Remix - Sergio Xalambrí',
  },
  {
    slug: 'zachtylr21-stable-forms-in-remix',
    category: 'articles',
    url: 'https://dev.to/zachtylr21/stable-forms-in-remix-226p',
    title: 'Stable Forms in Remix',
    description:
      'Data mutations in Remix are done with HTML forms, and Remix allows you to upgrade your forms with... Tagged with remix, html, javascript, react.',
    image:
      'https://res.cloudinary.com/practicaldev/image/fetch/s--bWSPoT3h--/c_imagga_scale,f_auto,fl_progressive,h_500,q_auto,w_1000/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/137eonzswsc26ekk3i6g.jpeg',
  },
  {
    slug: 'zachtylr21-building-a-simple-search-ui-with-remix',
    category: 'articles',
    url: 'https://dev.to/zachtylr21/building-a-simple-search-ui-with-remix-57da',
    title: 'Building a Simple Search UI with Remix',
    description:
      'Photo: Markus Winkler on Unsplash.     One thing I love most about Remix is how it encourages you to... Tagged with remix, react, html, twitter.',
    image:
      'https://res.cloudinary.com/practicaldev/image/fetch/s--SDE8qHtu--/c_imagga_scale,f_auto,fl_progressive,h_500,q_auto,w_1000/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9fducyx7vpyy1mlwvkgd.jpeg',
  },
  {
    slug: 'sergiodxa-sending-data-from-layout-to-leaf-routes-in-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/sending-data-from-layout-to-leaf-routes-in-remix',
    title: 'Sending data from layout to leaf routes in Remix - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-using-service-workers-with-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/using-service-workers-with-remix',
    title: 'Using Service Workers with Remix - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-localizing-remix-apps-with-i18next',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/localizing-remix-apps-with-i18next',
    title: 'Localizing Remix apps with i18next - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-adding-csrf-protection-to-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/adding-csrf-protection-to-remix',
    title: 'Adding CSRF protection to Remix - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-load-only-the-data-you-need-in-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/load-only-the-data-you-need-in-remix',
    title: 'Load only the data you need in Remix - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-server-side-authentication-with-auth0-in-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/server-side-authentication-with-auth0-in-remix',
    title: 'Server-Side authentication with Auth0 in Remix - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-using-tailwindcss-with-remix',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/using-tailwindcss-with-remix',
    title: 'Using TailwindCSS with Remix - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-jest-matchers-for-remix-responses',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/jest-matchers-for-remix-responses',
    title: 'Jest Matchers for Remix responses - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-using-form-objects-inside-remix-actions',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/using-form-objects-inside-remix-actions',
    title: 'Using Form Objects inside Remix actions - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-route-protection-in-remix-with-policies',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/route-protection-in-remix-with-policies',
    title: 'Route protection in Remix with Policies - Sergio Xalambrí',
  },
  {
    slug: 'sergiodxa-redirect-to-the-original-url-inside-a-remix-action',
    category: 'articles',
    url: 'https://sergiodxa.com/articles/redirect-to-the-original-url-inside-a-remix-action',
    title:
      'Redirect to the original URL inside a Remix action - Sergio Xalambrí',
  },
];

export default entries;

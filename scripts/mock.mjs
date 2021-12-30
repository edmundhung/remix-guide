import { MockAgent, setGlobalDispatcher } from 'undici';

export function setupMock() {
  const mockAgent = new MockAgent({ connections: 1 });

  setGlobalDispatcher(mockAgent);

  // Optional: This makes all the request fails if no matching mock is found
  //   mockAgent.disableNetConnect();

  // Create MockClient by origin
  const github = mockAgent.get('https://github.com');
  const githubAPI = mockAgent.get('https://api.github.com');

  const accessTokenAPI = github
    .intercept({
      path: '/login/oauth/access_token',
      method: 'POST',
    })
    .reply(
      200,
      new URLSearchParams({
        access_token: 'a-platform-for-sharing-everything-about-remix',
        scope: 'emails',
        token_type: 'bearer',
      }).toString()
    )
    .persist();

  const userInfoAPI = githubAPI
    .intercept({
      path: '/user',
      method: 'GET',
    })
    .reply(200, {
      id: 'dev',
      login: 'RemixGuideDev',
      name: 'Remix Guide Developer',
      email: 'dev@remix.guide',
      avatar_url: null,
    })
    .persist();

  return () => {
    // Both github and githubAPI are MockClient
    // They are linked with the MockAgent as a WeakMap
    // Without the line below, the mock info is available only when the server is just started.
    console.log('Clearing mocks from MockClient:', { github, githubAPI });
    userInfoAPI.times(0);
    accessTokenAPI.times(0);
  };
}

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/?menu=open');
  });

  it('redirect users to github when login', () => {
    cy.intercept(/^https:\/\/github.com\/login\/oauth\/authorize/, (req) => {
      const url = new URL(req.url);
      const redirectUri = url.searchParams.get('redirect_uri');

      req.redirect(
        `${redirectUri}?code=remix-guide&state=${url.searchParams.get('state')}`
      );
    }).as('login');

    cy.findByText(/Login with GitHub/i).click();
    cy.wait('@login');
    cy.visit('/?menu=open');

    cy.findByText(/Login with GitHub/i).should('not.exist');
    cy.findByText(/Logout/i).should('exist');
  });
});

describe('Index', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should show the headline of the platform', () => {
    cy.findByText('An interactive list of awesome stuffs about Remix', {
      exact: false,
    }).should('exist');
  });
});

describe('Index', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should show the name of the platform', () => {
    cy.findAllByText('Remix Guide', {
      exact: false,
    }).should('exist');
  });
});

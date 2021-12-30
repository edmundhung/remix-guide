describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows a Logout button after login', () => {
    cy.login();

    cy.visit('/?menu=open');
    cy.findByText(/Login with GitHub/i).should('not.exist');
    cy.findByText(/Logout/i).should('exist');
  });

  it('allows user to logout', () => {
    cy.login();

    cy.visit('/?menu=open');
    cy.findByText(/Logout/i).click();

    cy.visit('/?menu=open');
    cy.findByText(/Login with GitHub/i).should('exist');
    cy.findByText(/Logout/i).should('not.exist');
  });
});

describe('Submission', () => {
  beforeEach(() => {
    cy.visit('/submit');
  });

  it('shows an error message if user is unauthenticated', () => {
    cy.get('form[action="/submit"]')
      .findByText(/Others/i)
      .click()
      .end()
      .findByLabelText(/Then, paste the URL here/i)
      .type('http://localhost:8787')
      .end()
      .findByRole('button', { name: /Submit/i })
      .click();

    cy.findAllByText(
      /Please login first before submitting new resources/i
    ).should('exist');
  });
});

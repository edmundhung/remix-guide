function submitURL(url: string, category = 'others') {
  cy.get('form[action="/submit"]')
    .findByText(category, { exact: false })
    .click()
    .end()
    .findByLabelText(/Then, paste the URL here/i)
    .type(url)
    .end()
    .findByRole('button', { name: /Submit/i })
    .click();
}

describe('Submission', () => {
  let baseUrl = Cypress.config('baseUrl');

  beforeEach(() => {
    cy.visit('/submit');
  });

  it('shows an error message if user is unauthenticated', () => {
    submitURL(baseUrl);

    cy.findAllByText(
      /Please login first before submitting new resources/i
    ).should('exist');
  });

  describe('When authenticated', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/submit');
    });

    it('redirects user to the resource page if the submission is success', () => {
      submitURL(baseUrl);

      cy.findAllByText(
        /The submitted resource is now published|A resource with the same url is found/i
      ).should('exist');
      cy.location('pathname').should('not.eq', '/submit');
    });

    it('redirects user to the resource page even the URL is submitted already', () => {
      submitURL(baseUrl, 'others');

      cy.visit('/submit');
      submitURL(baseUrl, 'tutorials'); // Category doesn't matter in this case

      cy.findAllByText(/A resource with the same url is found/i).should(
        'exist'
      );
      cy.location('pathname').should('not.eq', '/submit');
    });

    it('shows an error message if the url is unreachable', () => {
      submitURL(`${baseUrl}/url-we-never-use`, 'tutorials');

      cy.findAllByText(
        /Something wrong with the URL; Please try again later/i
      ).should('exist');
    });
  });
});

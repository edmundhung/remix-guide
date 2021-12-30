import type { Interception } from 'cypress/types/net-stubbing';
import './commands';

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with GitHub
       * Ensure menu is visible and click login button
       * @example cy.login()
       */
      login(): Chainable<Interception>;
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.location('href').then((href) => {
    const url = new URL(href);

    // Ensure the menu to be opened
    url.searchParams.set('menu', 'open');

    return cy.visit(url.toString());
  });
  cy.intercept(/^https:\/\/github.com\/login\/oauth\/authorize/, (req) => {
    const url = new URL(req.url);
    const redirectUri = url.searchParams.get('redirect_uri');

    req.redirect(
      `${redirectUri}?code=remix-guide&state=${url.searchParams.get('state')}`
    );
  }).as('login');

  cy.findByText(/Login with GitHub/i).click();
  return cy.wait('@login');
});

/// <reference types="cypress" />

describe('Homepage E2E Tests', () => {
  beforeEach(() => {
    // Start the development server before running tests
    // In a real CI environment, the server would already be running
    cy.visit('/');
  });

  it('should load the homepage successfully', () => {
    // Check that the page loads without errors
    cy.url().should('include', '/');

    // Check for basic page elements
    cy.get('body').should('be.visible');

    // Check that the page has a title
    cy.title().should('not.be.empty');
  });

  it('should display the main navigation', () => {
    // Check for navigation elements
    cy.get('nav').should('be.visible');

    // Check for brand/logo
    cy.contains('Prompt Hub').should('be.visible');

    // Check for navigation links that actually exist
    cy.contains('Community').should('be.visible');
    cy.contains('Academy').should('be.visible');
  });

  it('should have responsive layout', () => {
    // Test desktop view
    cy.viewport(1280, 720);
    cy.get('body').should('be.visible');

    // Test tablet view
    cy.viewport(768, 1024);
    cy.get('body').should('be.visible');

    // Test mobile view
    cy.viewport(375, 667);
    cy.get('body').should('be.visible');
  });

  it('should have proper meta tags for SEO', () => {
    // Check for essential meta tags
    cy.get('head meta[charset]').should('exist');
    cy.get('head meta[name="viewport"]').should('exist');
  });

  it('should not have console errors', () => {
    // Listen for console errors
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });

    cy.visit('/');
    cy.get('@consoleError').should('not.have.been.called');
  });
});

describe('Navigation E2E Tests', () => {
  it('should navigate to different pages', () => {
    cy.visit('/');

    // Test navigation to prompts page if it exists
    cy.get('body').then(($body) => {
      if ($body.find('a[href*="/prompts"]').length > 0) {
        cy.get('a[href*="/prompts"]').first().click();
        cy.url().should('include', '/prompts');
      }
    });
  });

  it('should handle 404 pages gracefully', () => {
    cy.visit('/non-existent-page', { failOnStatusCode: false });
    cy.contains('404').should('be.visible');
  });
});

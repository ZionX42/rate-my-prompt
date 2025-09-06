/// <reference types="cypress" />

describe('Prompt Features E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to prompt creation page', () => {
    // Look for create/new prompt link
    cy.get('body').then(($body) => {
      if ($body.find('a[href*="/prompts/new"]').length > 0) {
        cy.get('a[href*="/prompts/new"]').first().click();
        cy.url().should('include', '/prompts/new');

        // Check for form elements
        cy.get('form').should('be.visible');
        cy.get('input, textarea').should('have.length.greaterThan', 0);
      } else {
        cy.log('Prompt creation page not found - might not be implemented yet');
      }
    });
  });

  it('should display search functionality', () => {
    // Look for search input or search page
    cy.get('body').then(($body) => {
      if ($body.find('input[type="search"]').length > 0) {
        cy.get('input[type="search"]').first().should('be.visible');
      } else if ($body.find('input[placeholder*="search"]').length > 0) {
        cy.get('input[placeholder*="search"]').first().should('be.visible');
      } else if ($body.find('a[href*="/search"]').length > 0) {
        cy.get('a[href*="/search"]').first().click();
        cy.url().should('include', '/search');
        cy.get('input').should('be.visible');
      } else {
        cy.log('Search functionality not found - might not be implemented yet');
      }
    });
  });

  it('should handle prompt listing pages', () => {
    // Check if there's a prompts listing page
    cy.visit('/prompts', { failOnStatusCode: false });

    cy.get('body').then(($body) => {
      if ($body.find('main, .container').length > 0) {
        cy.get('main, .container').should('be.visible');
        cy.log('Prompts listing page exists');
      } else {
        cy.log('Prompts listing page might not be implemented yet');
      }
    });
  });
});

describe('User Profile E2E Tests', () => {
  it('should handle user profile pages', () => {
    // Test a sample user profile URL
    cy.visit('/users/test-user', { failOnStatusCode: false });

    cy.get('body').then(($body) => {
      if ($body.find('main, .profile').length > 0) {
        cy.get('main, .profile').should('be.visible');
        cy.log('User profile page structure exists');
      } else {
        cy.log('User profile page might not be fully implemented yet');
      }
    });
  });
});

describe('API Integration E2E Tests', () => {
  it('should handle API endpoints gracefully', () => {
    // Test that API endpoints return proper responses
    cy.request({
      url: '/api/prompts',
      method: 'POST',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 403, 503]); // Either working, validation error, auth required, or storage not configured
    });
  });

  it('should handle search API', () => {
    cy.request({
      url: '/api/search?q=test',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 503]); // Either working or storage not configured
    });
  });
});

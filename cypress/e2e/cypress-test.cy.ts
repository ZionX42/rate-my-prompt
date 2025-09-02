describe('Cypress Setup Test', () => {
  it('should verify Cypress can connect to Next.js server', () => {
    cy.visit('/');
    cy.get('h1').should('exist');
  });
});

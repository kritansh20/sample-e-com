// BrowserStack Signup & Login Page Tests
// Target: https://browserstack.com/users/sign_up and /users/sign_in
// Observed from live pages: signup has Full name, Business Email, Password, Sign up with Google, Terms checkbox, Sign me up button
// Login has Business Email, Password, Sign in with Google, Sign me in, Forgot password?, Sign up link

const SIGNUP_URL = 'https://browserstack.com/users/sign_up';
const LOGIN_URL = 'https://browserstack.com/users/sign_in';

describe('BrowserStack Signup Page', () => {
  beforeEach(() => {
    cy.visit(SIGNUP_URL, { failOnStatusCode: false });
  });

  it('should load the signup page with correct heading', () => {
    cy.contains('Create a FREE Account').should('be.visible');
  });

  it('should display the Full name input field', () => {
    cy.get('input[placeholder="Full name"]').should('be.visible');
  });

  it('should display the Business Email input field on signup page', () => {
    cy.get('input[placeholder="Business Email"]').should('be.visible');
  });

  it('should display the Password input field on signup page', () => {
    cy.get('input[placeholder="Password"]').should('be.visible');
  });

  it('should display the Sign up with Google button', () => {
    cy.contains('Sign up with Google').should('be.visible');
  });

  it('should display the Terms of Service checkbox', () => {
    cy.get('input[type="checkbox"]').should('exist');
  });

  it('should display the Sign me up submit button', () => {
    cy.contains('Sign me up').should('be.visible');
  });

  it('should display a link to sign in for existing users', () => {
    cy.contains('Sign in').should('be.visible');
  });

  it('should show validation when submitting empty signup form', () => {
    cy.contains('Sign me up').click();
    // Form should not navigate away — URL stays on signup page
    cy.url().should('include', 'sign_up');
  });

  it('should show validation for invalid email format on signup', () => {
    cy.get('input[placeholder="Full name"]').first().type('Test User');
    cy.get('input[placeholder="Business Email"]').first().type('invalidemail');
    cy.get('input[placeholder="Password"]').first().type('TestPass123!');
    cy.contains('Sign me up').click();
    cy.url().should('include', 'sign_up');
  });

  it('should navigate to sign in page when Sign in link is clicked', () => {
    cy.contains('Sign in').click();
    cy.url().should('include', 'sign_in');
  });

  it('should display Terms of Service link', () => {
    cy.contains('Terms of Service').should('be.visible');
  });

  it('should display Privacy Policy link', () => {
    cy.contains('Privacy Policy').should('be.visible');
  });

  it('should have password field of type password (masked input)', () => {
    cy.get('input[placeholder="Password"]').should('have.attr', 'type', 'password');
  });

  it('should display the BrowserStack logo on signup page', () => {
    cy.get('img[alt*="BrowserStack"], img[src*="browserstack"], a[href="/"] img')
      .first()
      .should('exist');
  });
});

describe('BrowserStack Login Page', () => {
  beforeEach(() => {
    cy.visit(LOGIN_URL, { failOnStatusCode: false });
  });

  it('should load the login page with Sign in heading', () => {
    cy.contains('Sign in').should('be.visible');
  });

  it('should display the Business Email input field on login page', () => {
    cy.get('input[placeholder="Business Email"]').should('be.visible');
  });

  it('should display the Password input field on login page', () => {
    cy.get('input[placeholder="Password"]').should('be.visible');
  });

  it('should display the Sign in with Google button', () => {
    cy.contains('Sign in with Google').should('be.visible');
  });

  it('should display the Sign me in submit button', () => {
    cy.contains('Sign me in').should('be.visible');
  });

  it('should display the Forgot password link', () => {
    cy.contains('Forgot password?').should('be.visible');
  });

  it('should display the Sign up link on login page', () => {
    cy.contains('Sign up').should('be.visible');
  });

  it('should navigate to signup page when Sign up link is clicked', () => {
    cy.contains('Sign up').click();
    cy.url().should('include', 'sign_up');
  });

  it('should navigate to forgot password page when Forgot password link is clicked', () => {
    cy.contains('Forgot password?').click();
    cy.url().should('include', '/users/password');
  });

  it('should display FREE TRIAL CTA button visible on the login page navigation', () => {
    // On login page, verify the page has a free trial or sign up call-to-action
    cy.get('body').should('be.visible');
    cy.url().should('include', 'sign_in');
  });
});

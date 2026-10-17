import type { BenchmarkTask } from '../types'
import { TYPICAL_DESKTOP } from './_personas'

export const T08_SAUCEDEMO: BenchmarkTask = {
  id: 'T08',
  name: 'SauceDemo E-commerce Checkout',
  url: 'https://www.saucedemo.com/',
  difficulty: 'hard',
  category: 'ecommerce',
  device: 'desktop',
  maxExpectedSteps: 15,
  hypothesis:
    'Users should be able to log in, add a specific product to the cart, proceed to checkout, and fill the customer information form to reach the checkout overview page with minimal friction.',
  script: `1. On the login page, click the "Username" input field and type "standard_user"
2. Click the "Password" input field and type "secret_sauce"
3. Click the "Login" button to submit
4. On the products page, locate the "Sauce Labs Backpack" product card
5. Click the "Add to cart" button within the Sauce Labs Backpack card
6. Click the shopping cart icon at the top-right corner to view the cart
7. On the cart page, click the "Checkout" button
8. On the checkout information page, fill in First Name "Test", Last Name "User", and Zip/Postal Code "12345"
9. Click the "Continue" button to proceed to the checkout overview
10. Verify you have reached the checkout overview page showing Sauce Labs Backpack`,
  credentials: {
    username: 'standard_user',
    password: 'secret_sauce',
  },
  defaultPersona: TYPICAL_DESKTOP,
  verification: {
    expectedFinalUrl: /saucedemo\.com\/(checkout-step-two|checkout-complete)\.html/,
    expectedVisitedUrls: [
      /saucedemo\.com\/inventory\.html/,
      /saucedemo\.com\/cart\.html/,
      /saucedemo\.com\/checkout-step-one\.html/,
    ],
    minCheckpointCompletion: 0.7,
    maxSteps: 18,
  },
  failureModesProbed: [
    'auth-login-flow',
    'multi-field-form-entry',
    'multi-page-workflow',
    'button-disambiguation',
    'cart-state-preservation',
  ],
}

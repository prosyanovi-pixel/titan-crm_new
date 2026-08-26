const path = require('path');

// Register Babel to allow Node.js to require and render .jsx files dynamically
require('@babel/register')({
  presets: ['@babel/preset-react'],
  // Only compile files in the emails directory
  only: [
    path.resolve(__dirname, '../../../emails')
  ],
  extensions: ['.jsx', '.js']
});

const { render } = require('@react-email/render');

/**
 * Render a React email template to HTML string
 * @param {Function} templateComponent - The React component (e.g. WelcomeEmail)
 * @param {Object} props - The props to pass to the component
 * @returns {Promise<string>} The rendered HTML
 */
async function renderEmail(templateComponent, props = {}) {
  // We use the render method from react-email
  return await render(templateComponent(props));
}

module.exports = {
  renderEmail
};

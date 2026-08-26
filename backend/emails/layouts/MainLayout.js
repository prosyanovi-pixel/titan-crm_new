const React = require('react');
const { Html, Body, Container, Section, Text, Link } = require('@react-email/components');

const MainLayout = ({ children, logoUrl }) => (
  <Html>
    <Body style={main}>
      <Container style={container}>
        {logoUrl && (
          <Section style={logoSection}>
            <img src={logoUrl} width="140" alt="Titan CRM Logo" />
          </Section>
        )}
        {children}
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Titan CRM. All rights reserved.
          </Text>
          <Link href="{{unsubscribe_url}}" style={footerLink}>
            Unsubscribe
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoSection = {
  padding: '20px 48px',
};

const footer = {
  padding: '0 48px',
  marginTop: '32px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
};

const footerLink = {
  color: '#8898aa',
  fontSize: '12px',
  textDecoration: 'underline',
};
module.exports = { MainLayout };

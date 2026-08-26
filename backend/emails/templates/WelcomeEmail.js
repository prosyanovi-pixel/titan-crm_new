const React = require('react');
const { Heading, Text, Button, Section } = require('@react-email/components');
const { MainLayout } = require('../layouts/MainLayout');

const WelcomeEmail = ({ userName, logoUrl }) => (
  <MainLayout logoUrl={logoUrl}>
    <Section style={content}>
      <Heading style={heading}>Welcome, {userName}!</Heading>
      <Text style={paragraph}>Thank you for joining Titan CRM.</Text>
      <Section style={btnContainer}>
        <Button style={button} href="https://your-app.com/dashboard">
          Go to Dashboard
        </Button>
      </Section>
    </Section>
  </MainLayout>
);

const content = {
  padding: '0 48px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
};

const btnContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#5e6ad2',
  borderRadius: '3px',
  fontWeight: '600',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  padding: '11px 23px',
};

module.exports = { WelcomeEmail };

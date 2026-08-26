import { useContext } from 'react';
import { MailContext } from './MailContext';

export const useMailContext = () => {
  const context = useContext(MailContext);
  if (context === undefined) {
    throw new Error('useMailContext must be used within a MailProvider');
  }
  return context;
};

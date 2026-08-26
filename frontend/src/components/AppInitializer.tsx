import React, { useEffect, useState } from 'react';
import { getModuleReferenceSeeds } from '@/modules';
import { api } from '@/lib/api';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        const seeds = getModuleReferenceSeeds();
        await api.post('/references/sync-modules', { modules: seeds });
      } catch (error) {
        // We log the error but don't block the app from starting
        console.warn('Module registry sync failed:', error);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isInitialized) {
    // Return null or a global splash screen while initializing fundamental systems
    return null; 
  }

  return <>{children}</>;
};

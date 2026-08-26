import React, { useEffect } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import nprogress from 'nprogress';
import 'nprogress/nprogress.css';

nprogress.configure({ showSpinner: false, minimum: 0.1, speed: 200 });

export function GlobalProgress() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = isFetching > 0 || isMutating > 0;

  useEffect(() => {
    if (isLoading) {
      nprogress.start();
    } else {
      nprogress.done();
    }
  }, [isLoading]);

  return null;
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/* eslint-disable import/first */
// Must be the first import
// if (process.env.NODE_ENV === 'development') {
//   // Must use require here as import statements are only allowed
//   // to exist at the top of a file.
//   // eslint-disable-next-line global-require
//   require('preact/debug');
// }

import ReactDOM from 'react-dom';

import { Body } from '@cloudbeaver/core-app';
import { ErrorBoundary } from '@cloudbeaver/core-blocks';
import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

export function renderLayout(serviceInjector: IServiceInjector): void {
  ReactDOM.render(
    <ErrorBoundary root>
      <AppContext app={serviceInjector}>
        <Body />
      </AppContext>
    </ErrorBoundary>,
    document.getElementById('root')
  );
}

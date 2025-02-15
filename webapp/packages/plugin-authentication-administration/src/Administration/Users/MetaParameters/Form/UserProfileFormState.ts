/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IFormStateInfo } from '@cloudbeaver/core-blocks';

import type { IUserProfileFormState } from './IUserProfileFormState';

export class UserProfileFormState implements IUserProfileFormState {
  get info(): IFormStateInfo {
    return {
      disabled: false,
      edited: false,
      readonly: false,
      statusMessage: null,
    };
  }

  async validate(): Promise<void> {

  }

  dispose(): void {

  }
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  baseAuthProvider: undefined as undefined | string,
  primaryAuthProvider: 'local',
};

export type AuthSettings = typeof defaultSettings;

@injectable()
export class AuthSettingsService {
  readonly settings = this.pluginManagerService.getPluginSettings('core.authentication', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}

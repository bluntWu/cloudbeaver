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
  maxFileSize: 100, // kilobyte
};

@injectable()
export class SqlEditorSettingsService {
  readonly settings = this.pluginManagerService.getPluginSettings('core.app.sqlEditor', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}

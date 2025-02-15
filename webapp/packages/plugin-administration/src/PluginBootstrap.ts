/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { SettingsMenuService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { PermissionsService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private settingsMenuService: SettingsMenuService,
    private permissionsService: PermissionsService,
    private screenService: ScreenService,
    private administrationScreenService: AdministrationScreenService,
  ) {
    super();
  }

  register(): void {
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'administrationMenuEnter',
        order: 0,
        isHidden: () => !this.permissionsService.has(EAdminPermission.admin)
          || this.screenService.isActive(AdministrationScreenService.screenName),
        title: 'administration_menu_enter',
        onClick: () => this.administrationScreenService.navigateToRoot(),
      }
    );
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'administrationMenuBack',
        order: 0,
        isHidden: () => !this.screenService.isActive(AdministrationScreenService.screenName),
        title: 'administration_menu_back',
        onClick: () => this.screenService.navigateToRoot(),
      }
    );
  }

  load(): void {}
}

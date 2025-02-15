/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SettingsMenuService, TopNavService } from '@cloudbeaver/core-app';
import { AuthInfoService, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { DATA_CONTEXT_MENU, DATA_CONTEXT_MENU_NESTED, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';

import { AuthenticationService } from './AuthenticationService';
import { AuthDialogService } from './Dialog/AuthDialogService';
import { UserInfo } from './UserInfo';
import { ChangeUserPasswordDialog } from './UserMenu/ChangeUserPasswordDialog/ChangeUserPasswordDialog';
import { MENU_USER_PROFILE } from './UserMenu/MENU_USER_PROFILE';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private serverConfigResource: ServerConfigResource,
    private authDialogService: AuthDialogService,
    private authenticationService: AuthenticationService,
    private authInfoService: AuthInfoService,
    private settingsMenuService: SettingsMenuService,
    private topNavService: TopNavService,
    private menuService: MenuService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable:
        context => {
          const profile = context.get(DATA_CONTEXT_MENU) === MENU_USER_PROFILE
            && !context.get(DATA_CONTEXT_MENU_NESTED);

          return profile && !!this.authInfoService.userInfo?.linkedAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID);
        },
      getItems: (context, items) => [
        ...items,
        new MenuBaseItem('change-password', 'authentication_user_password_change_menu_title', undefined, {
          onSelect: () => this.commonDialogService.open(ChangeUserPasswordDialog, null),
        }),
      ],
    });
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'login',
        order: 0,
        isHidden: () => this.serverConfigResource.enabledAuthProviders.length === 0 || !!this.authInfoService.userInfo,
        title: 'authentication_login',
        onClick: () => this.authDialogService.showLoginForm(false, null, true),
      }
    );

    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'logout',
        order: Number.MAX_SAFE_INTEGER,
        isHidden: () => !this.authInfoService.userInfo,
        title: 'authentication_logout',
        onClick: this.authenticationService.logout.bind(this.authenticationService),
      }
    );
    this.topNavService.placeholder.add(UserInfo, 4);
  }

  load(): void | Promise<void> { }
}

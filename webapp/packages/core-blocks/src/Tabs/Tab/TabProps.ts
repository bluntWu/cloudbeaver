/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PropsWithChildren } from 'react';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { ITabData } from '../TabsContainer/ITabsContainer';

export type TabProps = PropsWithChildren<{
  tabId: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  style?: ComponentStyle;
  onOpen?: (tab: ITabData<any>) => void;
  onClose?: (tab: ITabData<any>) => void;
  onClick?: (tabId: string) => void;
}>;

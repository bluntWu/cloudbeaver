/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren, ReactNode, forwardRef } from 'react';
import styled from 'reshadow';

import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { TabsState } from '../TabsState';

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string;
  tabs?: ReactNode;
  tabIndex?: number;
  className?: string;
  style?: ComponentStyle;
}>;

export const TabsBox = forwardRef<HTMLDivElement, TabsBoxProps>(function TabsBox({
  currentTabId,
  tabs,
  tabIndex,
  children,
  className,
  style,
}, ref) {
  return styled(useStyles(style))(
    <TabsState currentTabId={currentTabId}>
      <tabs-box ref={ref} as="div" className={className} tabIndex={tabIndex}>
        {tabs && <tabs>{tabs}</tabs>}
        <tab-panels>
          {children}
        </tab-panels>
      </tabs-box>
    </TabsState>
  );
});

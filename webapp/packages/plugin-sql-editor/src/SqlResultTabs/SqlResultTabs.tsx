/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  Tab, TabPanel, TabTitle, TabList, TextPlaceholder, ITabData, TabIcon, TabsState, getComputed
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlResultPanel } from './SqlResultPanel';
import { SqlResultTabsService } from './SqlResultTabsService';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
    TabIcon {
      composes: theme-text-surface from global;
    }
    TabList {
      composes: theme-background-background theme-text-text-primary-on-light from global;
    }
  `,
  css`
    wrapper {
      overflow: auto;
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      position: relative;
    }
    TabsBox {
      height: 100%;
    }
    TabList {
      display: flex;
    }
  `
);

interface Props {
  state: ISqlEditorTabState;
  onTabSelect?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export const SqlResultTabs = observer<Props>(function SqlDataResult({ state, onTabSelect, onTabClose }) {
  const style = useStyles(styles);
  const translate = useTranslate();
  const sqlResultTabsService = useService(SqlResultTabsService);

  const orderedTabs = getComputed(() => state.tabs
    .slice()
    .sort((tabA, tabB) => {
      const resultTabA = state.resultTabs.find(tab => tab.tabId === tabA.id);
      const resultTabB = state.resultTabs.find(tab => tab.tabId === tabB.id);

      if (resultTabA && resultTabB && tabA.order === tabB.order) {
        return resultTabA.indexInResultSet - resultTabB.indexInResultSet;
      }

      return tabA.order - tabB.order;
    }));

  function handleSelect(tab: ITabData) {
    sqlResultTabsService.selectResultTab(state, tab.tabId);
    onTabSelect?.(tab.tabId);
  }

  function handleClose(tab: ITabData) {
    sqlResultTabsService.removeResultTab(state, tab.tabId);
    onTabClose?.(tab.tabId);
  }

  if (!state.tabs.length) {
    return <TextPlaceholder>{translate('sql_editor_placeholder')}</TextPlaceholder>;
  }

  const currentId = state.currentTabId || '';

  return styled(style)(
    <wrapper>
      <TabsState currentTabId={currentId} onChange={handleSelect}>
        <TabList style={styles}>
          {orderedTabs.map(result => (
            <Tab key={result.id} tabId={result.id} style={styles} onClose={handleClose}>
              <TabIcon icon={result.icon} />
              <TabTitle>{result.name}</TabTitle>
            </Tab>
          ))}
        </TabList>
        {orderedTabs.map(result => (
          <TabPanel key={result.id} tabId={result.id} lazy>
            <SqlResultPanel state={state} id={result.id} />
          </TabPanel>
        ))}
      </TabsState>
    </wrapper>
  );
});

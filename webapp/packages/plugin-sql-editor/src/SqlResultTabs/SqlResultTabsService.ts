/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlExecutionPlanService } from './ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryResultService } from './SqlQueryResultService';
import { SqlQueryService } from './SqlQueryService';

@injectable()
export class SqlResultTabsService {
  constructor(
    private sqlQueryService: SqlQueryService,
    private sqlQueryResultService: SqlQueryResultService,
    private sqlExecutionPlanService: SqlExecutionPlanService,
  ) { }

  selectResultTab(state: ISqlEditorTabState, resultId: string): void {
    state.currentTabId = resultId;
  }

  removeResultTab(state: ISqlEditorTabState, tabId: string): void {
    const tab = state.tabs.find(tab => tab.id === tabId);

    if (tab) {
      state.tabs.splice(state.tabs.indexOf(tab), 1);
    }

    this.sqlQueryService.removeStatisticsTab(state, tabId);
    this.sqlQueryResultService.removeResultTab(state, tabId);
    this.sqlExecutionPlanService.removeExecutionPlanTab(state, tabId);

    if (state.currentTabId === tabId) {
      if (state.tabs.length > 0) {
        state.currentTabId = state.tabs[0].id;
      } else {
        state.currentTabId = '';
      }
    }
  }
}

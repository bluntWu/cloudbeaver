/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ConnectionExecutionContextService, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';
import { DatabaseDataAccessMode, DatabaseDataModel, getDefaultRowsCount, IDatabaseDataModel, IDatabaseResultSet, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { IDataQueryOptions, QueryDataSource } from '../QueryDataSource';
import { SqlQueryResultService } from './SqlQueryResultService';

interface IQueryExecutionOptions {
  onQueryExecutionStart?: (query: string, index: number) => void;
  onQueryExecuted?: (query: string, index: number, success: boolean) => void;
}

export interface IQueryExecutionStatistics {
  queries: number;
  executedQueries: number;
  updatedRows: number;
  executeTime: number;
  modelId: string | null;
}

@injectable()
export class SqlQueryService {
  private statisticsMap: Map<string, IQueryExecutionStatistics>;

  constructor(
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private connectionExecutionContextService: ConnectionExecutionContextService,
    private sqlQueryResultService: SqlQueryResultService,
    private asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    this.statisticsMap = new Map();

    makeObservable<this, 'statisticsMap'>(this, {
      statisticsMap: observable,
    });
  }

  getStatistics(tabId: string): IQueryExecutionStatistics | undefined {
    return this.statisticsMap.get(tabId);
  }

  async executeEditorQuery(
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    const contextInfo = editorState.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.baseId);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>;
    let isNewTabCreated = false;

    const connectionInfo = await this.connectionInfoResource.load(contextInfo.connectionId);
    let tabGroup = this.sqlQueryResultService.getSelectedGroup(editorState);

    if (inNewTab || !tabGroup) {
      source = new QueryDataSource(this.graphQLService, this.asyncTaskInfoService, this.notificationService);
      model = this.tableViewerStorageService.add(new DatabaseDataModel(source));
      tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);

      isNewTabCreated = true;
    } else {
      model = this.tableViewerStorageService.get(tabGroup.modelId)!;
      source = model.source as QueryDataSource;
      tabGroup.query = query;
    }

    model
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default)
      .setOptions({
        query: query,
        connectionId: contextInfo.connectionId,
        constraints: [],
        whereFilter: '',
      })
      .source
      .setExecutionContext(executionContext)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats);

    this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId, true);

    try {
      await model
        .setCountGain(getDefaultRowsCount())
        .setSlice(0)
        .requestData();

      this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId);
    } catch (exception) {
      // remove group if execution was cancelled
      if (source.currentTask?.cancelled && isNewTabCreated) {
        this.sqlQueryResultService.removeGroup(editorState, tabGroup.groupId);
        const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
        this.notificationService.logException(exception, 'Query execution Error', message);
        return;
      }
      throw exception;
    }
  }

  async executeQueries(
    editorState: ISqlEditorTabState,
    queries: string[],
    options?: IQueryExecutionOptions
  ): Promise<void> {
    const contextInfo = editorState.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.baseId);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const connectionInfo = await this.connectionInfoResource.load(contextInfo.connectionId);

    const statisticsTab = this.sqlQueryResultService.createStatisticsTab(editorState);

    this.statisticsMap.set(statisticsTab.tabId, {
      queries: queries.length,
      executedQueries: 0,
      executeTime: 0,
      updatedRows: 0,
      modelId: null,
    });

    editorState.currentTabId = statisticsTab.tabId;

    const statistics = this.getStatistics(statisticsTab.tabId)!;

    let source: QueryDataSource | undefined;
    let model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet> | undefined;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      options?.onQueryExecutionStart?.(query, i);

      if (!model || !source) {
        source = new QueryDataSource(this.graphQLService, this.asyncTaskInfoService, this.notificationService);
        model = this.tableViewerStorageService.add(new DatabaseDataModel(source));
      }
      statistics.modelId = model.id;

      model
        .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default)
        .setOptions({
          query: query,
          connectionId: contextInfo.connectionId,
          constraints: [],
          whereFilter: '',
        })
        .source
        .setExecutionContext(executionContext)
        .setSupportedDataFormats(connectionInfo.supportedDataFormats);

      try {
        await model
          .setCountGain(getDefaultRowsCount())
          .setSlice(0)
          .requestData();

        statistics.executedQueries++;
        statistics.executeTime += source.requestInfo.requestDuration;

        for (const result of source.results) {
          statistics.updatedRows += result.updateRowCount;
        }

        if (source.results.some(result => result.data)) {
          const tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);
          this.sqlQueryResultService.updateGroupTabs(
            editorState,
            model,
            tabGroup.groupId,
            false,
            statisticsTab.order,
            i + 1
          );

          model = source = undefined;
        }
        options?.onQueryExecuted?.(query, i, true);
      } catch (exception) {
        if (model) {
          const tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);
          this.sqlQueryResultService.updateGroupTabs(
            editorState,
            model,
            tabGroup.groupId,
            true,
            statisticsTab.order,
            i + 1
          );

          model = source = undefined;
        }
        options?.onQueryExecuted?.(query, i, false);
        break;
      }
    }

    statistics.modelId = null;

    if (model) {
      this.tableViewerStorageService.remove(model.id);
    }
  }

  removeStatisticsTab(state: ISqlEditorTabState, tabId: string): void {
    this.sqlQueryResultService.removeStatisticsTab(state, tabId);
    this.statisticsMap.delete(tabId);
  }
}

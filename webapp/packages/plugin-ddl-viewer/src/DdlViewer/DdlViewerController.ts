/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { NodeManagerUtils, NavNodeManagerService } from '@cloudbeaver/core-app';
import { IDestructibleController, IInitializableController, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { SqlDialectInfoService } from '@cloudbeaver/plugin-sql-editor';

import { DdlViewerService } from '../DdlViewerService';

@injectable()
export class DdlViewerController implements IInitializableController, IDestructibleController {
  isLoading = true;
  metadata = '';
  dialect?: SqlDialectInfo;

  private nodeId!: string;

  constructor(
    private ddlViewerService: DdlViewerService,
    private navNodeManagerService: NavNodeManagerService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private notificationService: NotificationService
  ) {
    makeObservable(this, {
      isLoading: observable,
      metadata: observable,
      dialect: observable,
    });
  }

  init(nodeId: string): void {
    this.nodeId = nodeId;
  }

  async load(): Promise<void> {
    await this.showMetadata(this.nodeId);
  }

  destruct(): void {
    this.ddlViewerService.resetMetadata(this.nodeId);
  }

  private async showMetadata(nodeId: string): Promise<void> {
    try {
      this.metadata = await this.ddlViewerService.loadDdlMetadata(nodeId)!;
      await this.loadDialect(nodeId);
    } catch (error) {
      this.notificationService.logException(error, 'Failed to load DDL');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadDialect(nodeId: string): Promise<void> {
    const { connectionId } = this.navNodeManagerService.getNodeContainerInfo(nodeId);
    if (!connectionId) {
      return;
    }
    const connection = NodeManagerUtils.connectionNodeIdToConnectionId(connectionId);
    this.dialect = await this.sqlDialectInfoService.loadSqlDialectInfo(connection);
  }
}

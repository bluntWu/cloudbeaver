/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { TabsContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { ConnectionFormService, ConnectionFormState, IConnectionFormState } from '@cloudbeaver/plugin-connections';

import { ConnectionsResource } from '../ConnectionsResource';
import { ConnectionsAdministrationNavService } from './ConnectionsAdministrationNavService';

export interface ICreateMethodOptions {
  configurationWizard?: {
    activationPriority?: number;
  };
  close?: () => void;
}

@injectable()
export class CreateConnectionService {
  disabled = false;
  data: IConnectionFormState | null;

  readonly tabsContainer: TabsContainer<void, ICreateMethodOptions>;

  constructor(
    private readonly connectionsAdministrationNavService: ConnectionsAdministrationNavService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly connectionFormService: ConnectionFormService,
    private readonly connectionsResource: ConnectionsResource
  ) {
    this.data = null;
    this.tabsContainer = new TabsContainer();

    makeObservable(this, {
      data: observable,
      disabled: observable,
    });

    this.setConnectionTemplate = this.setConnectionTemplate.bind(this);
    this.clearConnectionTemplate = this.clearConnectionTemplate.bind(this);
    this.setCreateMethod = this.setCreateMethod.bind(this);
    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);
  }

  getDefault(): string | null {
    const tabs = this.tabsContainer.getDisplayed();

    if (tabs.length === 0) {
      return null;
    }

    if (this.administrationScreenService.isConfigurationMode) {
      const sorted = tabs.sort((a, b) => {
        const aPriority = a.options?.configurationWizard?.activationPriority || Number.MAX_SAFE_INTEGER;
        const bPriority = b.options?.configurationWizard?.activationPriority || Number.MAX_SAFE_INTEGER;

        return aPriority - bPriority;
      });

      return sorted[0].key;
    }

    return tabs[0].key;
  }

  setCreateMethod(method?: string | null): void {
    if (!method) {
      const id = this.getDefault();

      if (!id) {
        return;
      }
      method = id;
    }
    this.activateMethod(method);
  }

  cancelCreate(): void {
    this.clearConnectionTemplate();
    this.connectionsAdministrationNavService.navToRoot();
  }

  create(): void {
    const defaultId = this.getDefault();
    if (!defaultId) {
      return;
    }

    this.activateMethod(defaultId);
  }

  setConnectionTemplate(config: ConnectionConfig, availableDrivers: string[]): void {
    this.data = new ConnectionFormState(
      this.connectionFormService,
      this.connectionsResource
    );

    this.data
      .setOptions('create', 'admin')
      .setConfig(config)
      .setAvailableDrivers(availableDrivers || []);

    this.data.load();
  }

  clearConnectionTemplate(): void {
    this.data?.dispose();
    this.data = null;
  }

  close(): void {
    this.clearConnectionTemplate();
    const tabs = this.tabsContainer.getDisplayed();

    for (const method of tabs) {
      method.options?.close?.();
    }
  }

  private activateMethod(method: string) {
    this.tabsContainer.select(method);
    this.connectionsAdministrationNavService.navToCreate(method);
  }
}

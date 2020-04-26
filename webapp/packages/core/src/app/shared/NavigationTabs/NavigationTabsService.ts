/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  observable, action,
  computed, IKeyValueMap,
} from 'mobx';
import { Subject } from 'rxjs';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { LocalStorageSaveService } from '@dbeaver/core/settings';

import { ITab } from './ITab';
import { TabHandler, TabHandlerOptions, TabHandlerEvent } from './TabHandler';
import { TabNavigationContext, ITabNavigationContext } from './TabNavigationContext';

type TabsState = {
  tabs: string[];
  history: string[];
  currentId: string;
}

const NAVIGATION_TABS_BASE_KEY = 'navigation_tabs';

@injectable()
export class NavigationTabsService {
  @observable handlers = new Map<string, TabHandler>();
  @observable tabsMap = new Map<string, ITab>();
  @observable state: TabsState = {
    tabs: [],
    history: [],
    currentId: '',
  };

  @computed get currentTabId(): string {
    return this.state.currentId;
  }

  @computed get tabIdList(): string[] {
    return this.state.tabs;
  }

  onTabSelect = new Subject<ITab>();
  onTabClose = new Subject<ITab>();

  constructor(private notificationService: NotificationService,
              private autoSaveService: LocalStorageSaveService) {
    this.autoSaveService.withAutoSave(
      this.tabsMap,
      `${NAVIGATION_TABS_BASE_KEY}_tab_map`,
      (json): IKeyValueMap<ITab> => {
        const map: IKeyValueMap<ITab> = {};
        for (const [key, value] of Object.entries(json as IKeyValueMap<ITab>)) {
          if (
            typeof value.id === 'string'
            && typeof value.handlerId === 'string'
            && (!value.name || typeof value.name === 'string')
            && (!value.icon || typeof value.icon === 'string')
          ) {
            map[key] = value;
          }
        }
        return map;
      }
    );

    this.autoSaveService.withAutoSave(this.state, NAVIGATION_TABS_BASE_KEY);
  }

  @action openTab(tab: ITab, isSelected?: boolean) {
    this.tabsMap.set(tab.id, tab);
    this.state.tabs.push(tab.id);

    if (isSelected) {
      this.selectTab(tab.id);
    }
  }

  @action selectTab(tabId: string, skipHandlers?: boolean) {
    const tab = this.tabsMap.get(tabId);
    if (!tab) {
      return;
    }

    if (this.state.currentId !== tabId) {
      this.state.history = this.state.history.filter(id => id !== tabId);
      this.state.history.unshift(tabId);
      this.state.currentId = tabId;
    }

    if (!skipHandlers) {
      this.callHandlerCallback(tab, handler => handler.onSelect);
    }

    this.onTabSelect.next(tab);
  }

  @action async closeTab(tabId: string, skipHandlers?: boolean) {
    const tab = this.tabsMap.get(tabId);
    if (tab && !skipHandlers) {
      await this.callHandlerCallback(tab, handler => handler.onClose);
    }

    this.onTabClose.next(tab);
    this.state.history = this.state.history.filter(id => id !== tabId);
    this.tabsMap.delete(tabId);
    this.state.tabs = this.state.tabs.filter(id => id !== tabId);
    if (this.state.currentId === tabId) {
      this.selectTab(this.state.history[0] || '', skipHandlers);
    }
  }

  @action registerTabHandler<TState>(
    options: TabHandlerOptions<TState>,
  ): TabHandler<TState> {
    const tabHandler = new TabHandler(options);
    this.handlers.set(options.key, tabHandler);
    return tabHandler;
  }

  @action updateHandlerState<T>(tabId: string, state: T) {
    const tab = this.tabsMap.get(tabId);
    if (tab) {
      tab.handlerState = state;
    }
  }

  getTabHandler(handlerId: string): TabHandler | undefined {
    return this.handlers.get(handlerId);
  }

  getHandlerState<T>(tabId: string): T | undefined {
    const tab = this.tabsMap.get(tabId);

    if (!tab) {
      return;
    }

    return tab.handlerState;
  }

  getTab(tabId: string): ITab | undefined {
    return this.tabsMap.get(tabId);
  }

  findTab<S extends ITab>(predicate: (tab: ITab) => tab is S): S | null;
  findTab(predicate: (tab: ITab) => boolean): ITab | null;
  findTab(predicate: (tab: ITab) => boolean): ITab | null {
    for (const tab of this.tabsMap.values()) {
      if (predicate(tab)) {
        return tab;
      }
    }
    return null;
  }

  findTabs(predicate: (tab: ITab) => boolean): Generator<ITab>;
  findTabs<S>(predicate: (tab: ITab) => tab is ITab<S>): Generator<ITab<S>>;
  * findTabs(predicate: (tab: ITab) => boolean): Generator<ITab> {
    for (const tab of this.tabsMap.values()) {
      if (predicate(tab)) {
        yield tab;
      }
    }
  }

  // must be executed with low priority, because this call runs many requests to backend and blocks others
  async restoreTabs() {
    const removedTabs: string[] = [];
    const restoreTasks: Promise<void>[] = [];

    for (const tabId of this.state.tabs) {
      const tab = this.tabsMap.get(tabId);
      if (!tab) {
        removedTabs.push(tabId);
        continue;
      }

      restoreTasks.push(this.restoreTab(tab, removedTabs));
    }

    await Promise.all(restoreTasks);

    if (removedTabs.length > 0) {
      this.notificationService.logError({ title: 'Some tabs cannot be restored properly', isSilent: true });
    }

    for (const tabId of removedTabs) {
      this.closeTab(tabId, true);
    }

    if (this.tabsMap.has(this.state.currentId)) {
      this.selectTab(this.state.currentId);
    }
  }

  navigationTabContext = (): ITabNavigationContext => new TabNavigationContext(this)

  private async callHandlerCallback(tab: ITab, selector: (handler: TabHandler) => TabHandlerEvent | undefined) {
    const handler = this.handlers.get(tab.handlerId);
    if (!handler) {
      return;
    }
    const callback = selector(handler);
    if (callback) {
      await callback.call(handler, tab);
    }
  }

  private async restoreTab(tab: ITab, removedTabs: string[]): Promise<void> {
    let restoreFail = false;
    try {
      const handler = this.handlers.get(tab.handlerId);

      if (!handler || (handler.onRestore && !await handler.onRestore(tab))) {
        restoreFail = true;
      }
    } catch {
      restoreFail = true;
    }

    if (restoreFail) {
      removedTabs.push(tab.id);
    }
  }
}

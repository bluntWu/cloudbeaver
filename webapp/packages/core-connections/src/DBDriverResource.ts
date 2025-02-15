/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  ResourceKeyUtils,
  DatabaseDriverFragment,
  DriverListQueryVariables,
  CachedMapAllKey,
  resourceKeyList
} from '@cloudbeaver/core-sdk';

export type DBDriver = DatabaseDriverFragment;

@injectable()
export class DBDriverResource extends CachedMapResource<string, DBDriver, DriverListQueryVariables> {
  constructor(
    private graphQLService: GraphQLService,
    permissionsResource: PermissionsResource,
  ) {
    super();
    permissionsResource.require(this, EPermission.public);
  }

  async loadAll(): Promise<Map<string, DBDriver>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  compare(driverA: DBDriver, driverB: DBDriver): number {
    if (driverA.promotedScore === driverB.promotedScore) {
      return (driverA.name || '').localeCompare((driverB.name || ''));
    }

    return (driverB.promotedScore || 0) - (driverA.promotedScore || 0);
  }

  protected async loader(key: ResourceKey<string>, includes: string[]): Promise<Map<string, DBDriver>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const driverId = all ? undefined : key;

      const { drivers } = await this.graphQLService.sdk.driverList({
        driverId,
        includeDriverParameters: false,
        includeDriverProperties: false,
        includeProviderProperties: false,
        ...this.getIncludesMap(driverId, includes),
      });

      if (all) {
        this.resetIncludes();
        this.data.clear();
      }

      this.updateDriver(...drivers);
    });

    return this.data;
  }

  private updateDriver(...drivers: DBDriver[]) {
    const keys = resourceKeyList(drivers.map(driver => driver.id));

    const oldDriver = this.get(keys);
    this.set(keys, oldDriver.map((oldDriver, i) => ({ ...oldDriver, ...drivers[i] })));
  }
}

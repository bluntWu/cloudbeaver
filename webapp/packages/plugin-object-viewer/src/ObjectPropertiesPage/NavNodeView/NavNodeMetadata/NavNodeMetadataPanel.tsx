/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNodeTransformViewComponent } from '@cloudbeaver/core-app';

import { ObjectProperties } from './ObjectProperties';

export const NavNodeMetadataPanel: NavNodeTransformViewComponent = function NavNodeMetadataPanel({
  nodeId,
  parents,
}) {
  return <ObjectProperties objectId={nodeId} parents={parents} />;
};

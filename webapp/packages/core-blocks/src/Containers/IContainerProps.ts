/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ILayoutSizeProps } from './ILayoutSizeProps';

export interface IContainerProps extends ILayoutSizeProps {
  flexStart?: boolean;
  baseline?: boolean;
  center?: boolean;
  vertical?: boolean;
  wrap?: boolean;
  overflow?: boolean;
  parent?: boolean;
  gap?: boolean;
  grid?: boolean;
}

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ButtonHTMLAttributes } from 'react';
import { Button } from 'reakit/Button';
import styled, { css } from 'reshadow';

import { composes, useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

const buttonStyle = composes(
  css`
    Button {
      composes: theme-ripple from global;
    }  
  `,
  css`
    Button {
      height: 100%;
      padding: 0 16px !important;
      text-transform: uppercase;
      font-weight: 700;
      
      background: none;
      border: none;
      outline: none !important;
      color: inherit;
      cursor: pointer;
 
      & div {
        display: flex;
        align-items: center;
      }
    }
  `
);

interface IProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  style?: ComponentStyle;
}

export const TopMenuButton = observer<IProps>(function TopMenuItem({ style, children, ...props }) {
  return styled(useStyles(buttonStyle, style))(
    <Button as="button" {...props}>
      <div>{children}</div>
    </Button>
  );
});

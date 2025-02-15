/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Tab } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

interface Props {
  className?: string;
  style?: ComponentStyle;
}

export const UserAuthProvidersTab = observer<Props>(function UserAuthProvidersTab({
  className,
  style,
}) {
  const translate = useTranslate();
  const styles = useStyles(style);

  return styled(styles)(
    <Tab tabId='auth-providers' style={style} className={className}>{translate('plugin_user_profile_auth_providers')}</Tab>
  );
});

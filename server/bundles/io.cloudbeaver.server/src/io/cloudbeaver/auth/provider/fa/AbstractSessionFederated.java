/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2021 DBeaver Corp
 *
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */

package io.cloudbeaver.auth.provider.fa;

import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.access.DBASessionFederated;
import org.jkiss.dbeaver.model.access.DBASessionPrincipal;
import org.jkiss.dbeaver.model.app.DBPProject;
import org.jkiss.dbeaver.model.auth.DBAAuthSpace;

import java.util.Map;

public abstract class AbstractSessionFederated implements DBASessionFederated {

    @NotNull
    protected final Map<String, Object> authParameters;
    @NotNull
    protected final WebSession parentSession;
    @NotNull
    protected final DBAAuthSpace space;

    protected AbstractSessionFederated(@NotNull WebSession parentSession, @NotNull DBAAuthSpace space, @NotNull Map<String, Object> authParameters) {
        this.parentSession = parentSession;
        this.space = space;
        this.authParameters = authParameters;
    }

    @NotNull
    @Override
    public DBAAuthSpace getSessionSpace() {
        return space;
    }

    @Override
    public DBASessionPrincipal getSessionPrincipal() {
        return parentSession.getSessionPrincipal();
    }

    @Override
    public boolean isApplicationSession() {
        return false;
    }

    @Nullable
    @Override
    public DBPProject getSingletonProject() {
        return parentSession.getSingletonProject();
    }

    public void close() {
        // do nothing
    }

}

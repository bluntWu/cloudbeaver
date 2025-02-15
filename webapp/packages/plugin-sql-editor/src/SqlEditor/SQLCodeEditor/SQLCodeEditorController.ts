/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../plugin-codemirror/src/codemirror.meta.d.ts" />

import { Editor, EditorConfiguration, findModeByName, ModeSpec } from 'codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/search/searchcursor';
import { observable, makeObservable, computed } from 'mobx';
import type { IControlledCodeMirror } from 'react-codemirror2';

import { injectable } from '@cloudbeaver/core-di';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

interface ISqlModeOptions {
  keywords: Record<string, boolean>;
  builtin: Record<string, boolean>;
}

const COMMON_EDITOR_CONFIGURATION: EditorConfiguration = {
  theme: 'material',
  mode: 'text/x-sql',
  lineNumbers: true,
  indentWithTabs: true,
  smartIndent: true,
  autofocus: true,
};

@injectable()
export class SQLCodeEditorController {
  private dialect?: SqlDialectInfo;
  private editor?: Editor;

  get mode(): string | ModeSpec<ISqlModeOptions> | undefined {
    const name = (
      this.dialect?.name
      && this.editor
      && findModeByName(this.dialect.name)?.mime
    ) || COMMON_EDITOR_CONFIGURATION.mode as string;

    if (!this.dialect) {
      return name;
    }

    const keywords: Record<string, boolean> = {};
    const builtin: Record<string, boolean> = {};

    if (this.dialect?.dataTypes) {
      for (const key of this.dialect.dataTypes) {
        builtin[key.toLowerCase()] = true;
      }
    }

    if (this.dialect?.functions) {
      for (const key of this.dialect.functions) {
        builtin[key.toLowerCase()] = true;
      }
    }

    if (this.dialect?.reservedWords) {
      for (const key of this.dialect.reservedWords) {
        keywords[key.toLowerCase()] = true;
      }
    }

    return {
      name,
      keywords,
      builtin,
    };
  }

  bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: { ...COMMON_EDITOR_CONFIGURATION },
    editorDidMount: this.handleConfigure.bind(this),
    onBeforeChange: () => {},
  };

  constructor() {
    makeObservable<this, 'dialect' | 'editor'>(this, {
      dialect: observable.ref,
      editor: observable.ref,
      bindings: observable,
      mode: computed,
    });
  }

  setBindings(bindings?: Partial<IControlledCodeMirror>): void {
    this.bindings.options = {
      ...COMMON_EDITOR_CONFIGURATION,
      ...(bindings?.options || {}),
    };
    if (bindings?.editorDidMount) {
      this.bindings.editorDidMount = (editor: Editor, value: string, cb: () => void) => {
        this.handleConfigure(editor);
        bindings.editorDidMount!(editor, value, cb);
      };
    }
    if (bindings?.onBeforeChange) {
      this.bindings.onBeforeChange = bindings.onBeforeChange;
    }
  }

  setDialect(dialect?: SqlDialectInfo): void {
    if (this.dialect === dialect) {
      return;
    }

    this.dialect = dialect;
  }

  focus(): void {
    this.editor?.focus();
  }

  private handleConfigure(editor: Editor) {
    this.editor = editor;
  }
}

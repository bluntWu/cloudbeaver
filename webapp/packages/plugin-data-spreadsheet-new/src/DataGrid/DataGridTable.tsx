/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataGrid from 'react-data-grid';
import type { DataGridHandle } from 'react-data-grid';
import styled from 'reshadow';

import { TextPlaceholder } from '@cloudbeaver/core-blocks';
import { Executor } from '@cloudbeaver/core-executor';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { DatabaseDataSelectActionsData, DatabaseEditChangeType, IDatabaseResultSet, IDataPresentationProps, IResultSetEditActionData, IResultSetElementKey, IResultSetPartialKey, ResultSetDataKeysUtils, ResultSetSelectAction } from '@cloudbeaver/plugin-data-viewer';

import { CellPosition, EditingContext } from '../Editing/EditingContext';
import { useEditing } from '../Editing/useEditing';
import baseStyles from '../styles/base.scss';
import { reactGridStyles } from '../styles/styles';
import { DataGridContext, IColumnResizeInfo, IDataGridContext } from './DataGridContext';
import { DataGridSelectionContext } from './DataGridSelection/DataGridSelectionContext';
import { useGridSelectionContext } from './DataGridSelection/useGridSelectionContext';
import { CellFormatter } from './Formatters/CellFormatter';
import { RowRenderer } from './RowRenderer/RowRenderer';
import { TableDataContext } from './TableDataContext';
import { useGridDragging } from './useGridDragging';
import { useGridSelectedCellsCopy } from './useGridSelectedCellsCopy';
import { useTableData } from './useTableData';

function isAtBottom(event: React.UIEvent<HTMLDivElement>): boolean {
  const target = event.target as HTMLDivElement;
  return target.clientHeight + target.scrollTop + 100 > target.scrollHeight;
}

const rowHeight = 25;
const headerHeight = 28;

export const DataGridTable = observer<IDataPresentationProps<any, IDatabaseResultSet>>(function DataGridTable({ model, actions, resultIndex, className }) {
  const translate = useTranslate();

  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const dataGridDivRef = useRef<HTMLDivElement | null>(null);
  const dataGridRef = useRef<DataGridHandle>(null);
  const lastCount = useRef<number>(0);
  const styles = useStyles(reactGridStyles, baseStyles);
  const [columnResize] = useState(() => new Executor<IColumnResizeInfo>());

  const selectionAction = model.source.getAction(resultIndex, ResultSetSelectAction);

  const tableData = useTableData(model, resultIndex, dataGridDivRef);
  const focusSyncRef = useRef<CellPosition | null>(null);

  const gridSelectionContext = useGridSelectionContext(tableData, selectionAction);
  const editingContext = useEditing({
    readonly: model.isReadonly() || model.isDisabled(resultIndex),
    onEdit: (position, key) => {
      const column = tableData.getColumn(position.idx);
      const row = tableData.getRow(position.rowIdx);

      if (!column.columnDataIndex) {
        return false;
      }

      const cellKey: IResultSetElementKey = { row, column: column.columnDataIndex };

      // TODO: not works yet
      switch (key) {
        case 'Delete':
        case 'Backspace':
          tableData.editor.set(cellKey, '');
          break;
        default:
          if (key) {
            tableData.editor.set(cellKey, key);
          }
      }

      return true;
    },
  });

  function isGridInFocus(): boolean {
    const gridDiv = gridContainerRef.current;
    const focusSink = gridDiv?.querySelector('.rdg-focus-sink');

    if (!gridDiv || !focusSink) {
      return false;
    }

    const active = document.activeElement;

    return gridDiv === active || focusSink === active;
  }

  function setContainersRef(element: HTMLDivElement) {
    gridContainerRef.current = element;

    const gridDiv = gridContainerRef.current?.firstChild;

    if (gridDiv instanceof HTMLDivElement) {
      dataGridDivRef.current = gridDiv;
    } else {
      dataGridDivRef.current = null;
    }
  }

  const { onKeydownHandler } = useGridSelectedCellsCopy(tableData, selectionAction, gridSelectionContext);
  const { onMouseDownHandler, onMouseMoveHandler } = useGridDragging({
    onDragStart: startPosition => {
      dataGridRef.current?.selectCell({ idx: startPosition.colIdx, rowIdx: startPosition.rowIdx });
    },
    onDragOver: (startPosition, currentPosition, event) => {
      gridSelectionContext.selectRange(startPosition, currentPosition, event.ctrlKey || event.metaKey, true);
    },
    onDragEnd: (startPosition, currentPosition, event) => {
      gridSelectionContext.selectRange(startPosition, currentPosition, event.ctrlKey || event.metaKey, false);
    },
  });

  useEffect(() => {
    function syncEditor(data: IResultSetEditActionData) {
      const editor = tableData.editor;
      if (
        data.resultId !== editor.result.id
        || !data.value
        || data.value.length === 0
        || data.type === DatabaseEditChangeType.delete
      ) {
        return;
      }

      const key = data.value[data.value.length - 1].key;

      const idx = tableData.getColumnIndexFromColumnKey(key.column);
      const rowIdx = tableData.getRowIndexFromKey(key.row);

      if (data.revert) {
        editingContext.closeEditor({
          rowIdx,
          idx,
        });
      }

      if (selectionAction.isFocused(key)) {
        const rowTop = rowIdx * rowHeight;
        const gridDiv = dataGridDivRef.current;
        dataGridRef.current?.scrollToColumn(idx);

        if (gridDiv) {
          if (rowTop < gridDiv.scrollTop - rowHeight + headerHeight) {
            gridDiv.scrollTo({
              top: rowTop,
            });
          } else if (rowTop > gridDiv.scrollTop + gridDiv.clientHeight - headerHeight - rowHeight) {
            gridDiv.scrollTo({
              top: rowTop - gridDiv.clientHeight + headerHeight + rowHeight,
            });
          }
        }
        return;
      }
      dataGridRef.current?.selectCell({ idx, rowIdx });
    }

    tableData.editor.action.addHandler(syncEditor);

    function syncFocus(data: DatabaseDataSelectActionsData<IResultSetPartialKey>) {
      setTimeout(() => { // TODO: update focus after render rows update
        if (data.type === 'focus') {
          if (!data.key?.column || !data.key.row) {
            return;
          }

          const idx = tableData.getColumnIndexFromColumnKey(data.key.column);
          const rowIdx = tableData.getRowIndexFromKey(data.key.row);

          focusSyncRef.current = { idx, rowIdx };
          dataGridRef.current?.selectCell({ idx, rowIdx });
        }
      }, 1);
    }

    selectionAction.actions.addHandler(syncFocus);

    return () => {
      tableData.editor.action.removeHandler(syncEditor);
    };
  }, [tableData.editor, editingContext, selectionAction]);

  useEffect(() => {
    const gridDiv = dataGridDivRef.current;

    if (
      gridDiv
      && lastCount.current > model.source.count
      && model.source.count * rowHeight < gridDiv.scrollTop + gridDiv.clientHeight - headerHeight
    ) {
      gridDiv.scrollTo({
        top: model.source.count * rowHeight - gridDiv.clientHeight + headerHeight - 1,
      });
    }

    lastCount.current = model.source.count;
  }, [model.source.count]);

  const handleFocusChange = (position: CellPosition) => {
    if (
      focusSyncRef.current
      && focusSyncRef.current.idx === position.idx
      && focusSyncRef.current.rowIdx === position.rowIdx
    ) {
      focusSyncRef.current = null;
      return;
    }
    const column = tableData.getColumn(position.idx);
    const row = tableData.getRow(position.rowIdx);

    selectionAction.focus({
      row,
      column: column.columnDataIndex ?? { index: 0 },
    });
  };

  const handleScroll = useCallback(
    async (event: React.UIEvent<HTMLDivElement>) => {
      if (!isAtBottom(event)) {
        return;
      }

      const result = model?.getResult(resultIndex);
      if (result?.loadedFully) {
        return;
      }

      await model.requestDataPortion(0, model.countGain + model.source.count);
    },
    [model, resultIndex]
  );

  const gridContext = useMemo<IDataGridContext>(() => ({
    model,
    actions,
    columnResize,
    resultIndex,
    isGridInFocus,
    getEditorPortal: () => editorRef.current,
    getDataGridApi: () => dataGridRef.current,
  }), [model, actions, resultIndex, editorRef, dataGridRef, gridContainerRef]);

  if (!tableData.columns.length) {
    return <TextPlaceholder>{translate('data_grid_table_empty_placeholder')}</TextPlaceholder>;
  }

  return styled(styles)(
    <DataGridContext.Provider value={gridContext}>
      <DataGridSelectionContext.Provider value={gridSelectionContext}>
        <EditingContext.Provider value={editingContext}>
          <TableDataContext.Provider value={tableData}>
            <grid-container
              ref={setContainersRef}
              className="cb-react-grid-container"
              tabIndex={-1}
              onKeyDown={onKeydownHandler}
              onMouseDown={onMouseDownHandler}
              onMouseMove={onMouseMoveHandler}
            >
              <DataGrid
                ref={dataGridRef}
                className={`cb-react-grid-theme ${className}`}
                columns={tableData.columns}
                cellNavigationMode={editingContext.isEditorActive() ? 'NONE' : 'CHANGE_ROW'}
                defaultColumnOptions={{
                  minWidth: 50,
                  resizable: true,
                  formatter: CellFormatter,
                }}
                rows={tableData.rows}
                rowKeyGetter={ResultSetDataKeysUtils.serialize}
                headerRowHeight={headerHeight}
                rowHeight={rowHeight}
                rowRenderer={RowRenderer}
                onSelectedCellChange={handleFocusChange}
                onColumnResize={(idx, width) => columnResize.execute({ column: idx, width })}
                onScroll={handleScroll}
              />
              <div ref={editorRef} />
            </grid-container>
          </TableDataContext.Provider>
        </EditingContext.Provider>
      </DataGridSelectionContext.Provider>
    </DataGridContext.Provider>
  );
});

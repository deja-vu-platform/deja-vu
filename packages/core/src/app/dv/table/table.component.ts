import {
  Component, ElementRef, EventEmitter, Input, Type, Output
} from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material';

import { RunService } from '../run.service';
import { ComponentValue } from '../include/include.component';

export interface ColumnConfiguration {
  label: string;
  fieldName: string;
}

@Component({
  selector: 'dv-table',
  templateUrl: './table.component.html'
})
export class TableComponent {
  /**
   * A list of entities to show on the table
   */
  @Input() data: any[] = [];

  /**
   * A list of objects that defines the row names and corresponding field names
   */
  @Input() columnInfo: ColumnConfiguration[] = [];

  /**
   * Component that can be performed on each row
   */
  @Input() rowComponent: ComponentValue | undefined;

  /**
   * If true, a checkbox will appear on the left of each row
   * selected objects will be emitted to the output selectedRowObjects
   */
  @Input() enableSelection = false;

  /**
   * Text to display when empty list or undefined entities are passed in
   */
  @Input() noDataToShowText = 'No Data';

  /**
   * Objects that are currently selected
   */
  @Output() selectedRowObjects = new EventEmitter<Object[]>();
  _selectedRowObjects;
  table;
  displayedColumns;
  selection = new SelectionModel<Object>(true, []);

  constructor(private elem: ElementRef, private rs: RunService) {
    this.table = this;
  }

  ngOnInit() {
    this.rs.register(this.elem, this);

    const displayedColumns = this.columnInfo.map((column) => column.fieldName);
    if (this.rowComponent) {
      displayedColumns.push('rowComponent');
    }
    if (this.enableSelection) {
      displayedColumns.unshift('select');
    }
    this.displayedColumns = displayedColumns;
  }

  /**
   * From Angular Example:
   * https://material.angular.io/components/table/examples
   */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.data.length;
    return numSelected === numRows;
  }

  /** Toggle one row */
  toggle(row) {
    this.selection.toggle(row);
    this._selectedRowObjects = this.selection.selected;
    this.selectedRowObjects.emit(this._selectedRowObjects);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.data.forEach(row => this.selection.select(row));
    this._selectedRowObjects = this.selection.selected;
    this.selectedRowObjects.emit(this._selectedRowObjects);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Object): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'}`;
  }





}

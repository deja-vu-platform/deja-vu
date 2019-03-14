import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { MatMenuTrigger, MatTabGroup } from '@angular/material';
import { RunService } from '@deja-vu/core';
import * as _ from 'lodash';

import {
  ActionInstance,
  App,
  AppActionDefinition,
  flexAlign,
  flexJustify,
  Row
} from '../datatypes';
import { ScopeIO } from '../io';

const emptyRow = new Row();

@Component({
  selector: 'app-action-definition',
  templateUrl: './action-definition.component.html',
  styleUrls: ['./action-definition.component.scss']
})
export class ActionDefinitionComponent implements AfterViewInit, OnInit {
  @Input() app: App;
  @ViewChildren('instanceContainer')
    private instanceContainers: QueryList<ElementRef>;
  @ViewChildren('actionMenuContent')
    private actionMenuContents: QueryList<MatTabGroup>;
  actionInstance: ActionInstance;
  readonly scopeIO: ScopeIO = new ScopeIO();
  private readonly _rows: Row[] = [];
  private readonly keysDown: Set<string> = new Set();
  flexAlignEntries = Object.entries(flexAlign);
  flexJustifyEntries = Object.entries(flexJustify);

  constructor(private elem: ElementRef, private rs: RunService) { }

  ngOnInit() {
    if (this.actionInstance && this.actionInstance.isAppAction) {
      this.rs.registerAppAction(this.elem, this);
    }
  }

  ngAfterViewInit() {
    this.instanceContainers.changes.subscribe(() => {
      // causes changes to *ngIf so must happen in new microtask
      setTimeout(() => {
        this.calcShowHint();
      });
    });
  }

  @Input()
  set openAction(action: AppActionDefinition) {
    this.actionInstance = new ActionInstance(action, this.app);
    this.scopeIO.link(this.actionInstance);
  }

  @HostListener('document:keydown', ['$event.key'])
  handleKeyDown(key: string) {
    this.keysDown.add(key);
  }

  @HostListener('document:keyup', ['$event.key'])
  handleKeyUp(key: string) {
    this.keysDown.delete(key);
  }

  get rows() {
    this._rows.length = 0;
    this._rows.push.apply(
      this._rows,
      (<AppActionDefinition>this.actionInstance.of).rows
    );
    this._rows.push(emptyRow);

    return this._rows;
  }

  onActionMenuClosed() {
    this.scopeIO.link(this.actionInstance);
    // need to wait for values to propogate
    setTimeout(() => this.calcShowHint());
  }

  onRowMenuClosed() { }

  private calcShowHint() {
    let rowActions = 0;
    this.rows.forEach((row) => {
      row.actions.forEach((action, actionNum) => {
        const index = rowActions + actionNum;
        const actionContainer = this.instanceContainers.toArray()[index];
        const firstChild = actionContainer
          && actionContainer.nativeElement.firstElementChild.firstElementChild;
        const showHint = (
          firstChild
          && (
            firstChild.offsetHeight === 0
            || firstChild.offsetWidth === 0
          )
        );
        action['showHint'] = showHint;
      });
      rowActions += row.actions.length;
    });
  }

  stopPropIfShift(event: Event) {
    if (this.keysDown.has('Shift')) {
      event.stopPropagation();
    }
  }

  openMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  clickFirstTab(actionNum: number) {
    const tabGroupEl: HTMLElement = this.actionMenuContents
      .toArray()[actionNum]._elementRef.nativeElement;
    const firstTabEl = tabGroupEl
      .querySelector('.mat-tab-label');
    firstTabEl.dispatchEvent(new Event('mousedown'));
  }
}

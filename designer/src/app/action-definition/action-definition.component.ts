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
  AppActionInstance,
  flexAlign,
  flexJustify,
  Resolution,
  Row
} from '../datatypes';
import { ScopeIO } from '../io';

const emptyRow = new Row();

// perceptually distinct colors
// https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/
// I've ordered them to mostly have most accessible first
const COLORS = [
  '#4363d8', // blue
  '#800000', // maroon
  '#f58231', // orange
  '#e6beff', // lavender
  '#000075', // navy
  '#fabebe', // pink
  '#ffe119', // yellow
  '#3cb44b', // green
  '#e6194B', // red
  '#42d4f4', // cyan
  '#f032e6', // magenta
  '#469990', // teal
  '#9A6324', // brown
  '#aaffc3', // mint
  '#fffac8', // beige
  '#911eb4', // purple
  '#808000', // olive
  '#bfef45', // lime
  '#ffd8b1', // apricot
  '#a9a9a9' // grey
];

interface ColorAssignments {
  [actionID: string]: {
    [ioName: string]: string;
  };
}

@Component({
  selector: 'app-action-definition',
  templateUrl: './action-definition.component.html',
  styleUrls: ['./action-definition.component.scss']
})
export class ActionDefinitionComponent implements AfterViewInit, OnInit {
  @Input() app: App;
  @ViewChildren('instanceContainer')
    private instanceContainers: QueryList<ElementRef>;
  actionInstance: AppActionInstance;
  readonly scopeIO: ScopeIO = new ScopeIO();
  readonly flexAlignEntries = Object.entries(flexAlign);
  readonly flexJustifyEntries = Object.entries(flexJustify);
  private readonly _rows: Row[] = [];
  private readonly keysDown: Set<string> = new Set();

  private colorAssignments: ColorAssignments = {};

  constructor(private elem: ElementRef, private rs: RunService) { }

  @Input()
  set openAction(action: AppActionDefinition) {
    this.actionInstance = new AppActionInstance(action, this.app);
    this.link();
  }

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

  link() {
    this.scopeIO.link(this.actionInstance);
    let i = 0;
    this.colorAssignments = _.mapValues(
      this.actionInstance.referenced,
      (ioNames) => {
        const ioToColor = {};
        ioNames.forEach((ioName) => {
          if (!ioToColor[ioName]) {
            ioToColor[ioName] = COLORS[i];
            i += 1;
          }
        });

        return ioToColor;
      }
    );
  }

  onActionMenuClosed() {
    this.link();
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

  clickFirstTab(mtg: MatTabGroup) {
    // the selected tab is not highlighted unless we touch it
    const tabGroupEl: HTMLElement = mtg._elementRef.nativeElement;
    const firstTabEl = tabGroupEl.querySelector('.mat-tab-label');
    firstTabEl.dispatchEvent(new Event('mousedown'));
    // the not-selected tab does not load the first time for some reason
    const numTabs = 2;
    mtg.selectedIndex = (mtg.selectedIndex + 1) % numTabs;
    // selectedIndex seems to be a setter
    // we need to let it resolve before updating again
    setTimeout(() => mtg.selectedIndex = (mtg.selectedIndex + 1) % numTabs);
  }

  ioReferences(action: ActionInstance): Resolution[] {
    return _.uniq(
      _.filter(this.actionInstance.references[action.id], (r) => !!r)
    );
  }

  ioReferenced(action: ActionInstance): string[] {
    return (this.actionInstance.referenced[action.id] || []);
  }

  color(action: ActionInstance, ioName: string): string {
    return _.get(
      this.colorAssignments,
      [action.id, ioName],
      'rgba(0,0,0,0'
    ) as string;
  }

  max(...numbers: number[]): number {
    return Math.max(...numbers);
  }
}

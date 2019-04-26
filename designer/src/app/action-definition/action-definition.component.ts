import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { MatMenuTrigger, MatTabGroup } from '@angular/material';
import { RunService } from '@deja-vu/core';
import * as _ from 'lodash';
import * as tinycolor from 'tinycolor2';

import {
  ActionInstance,
  App,
  AppActionDefinition,
  flexAlign,
  flexJustify,
  Row
} from '../datatypes';
import { ScopeIO } from '../io';
import findReferences, {
  InReferences,
  OutReferences,
  Reference as IOReference
} from '../io-references';

interface Reference extends IOReference {
  forIO: string;
  forActionID: string;
}

const emptyRow = new Row();
const emptySet = new Set<string>();

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
export class ActionDefinitionComponent
implements AfterViewInit, OnChanges, OnInit {
  @Input() app: App;
  @Input() ioChange: EventEmitter<void>;
  @Input() actionInstance: ActionInstance;

  @ViewChildren('instanceContainer')
    private instanceContainers: QueryList<ElementRef>;
  private lastNumActions = 0;
  readonly scopeIO: ScopeIO = new ScopeIO();
  readonly flexAlignEntries = Object.entries(flexAlign);
  readonly flexJustifyEntries = Object.entries(flexJustify);
  // if we don't have a consistent object, angular freaks out
  private readonly _rows: Row[] = [];
  private readonly keysDown: Set<string> = new Set();
  private inReferences: InReferences;
  private outReferences: OutReferences;
  private ioReferencesCache: {[id: string]: Reference[]} = {};
  private ioReferencedCache: {[id: string]: { ioName: string }[]} = {};
  private availableColors: Set<string> = new Set(COLORS);
  private colorAssignments: ColorAssignments = {};

  constructor(private elem: ElementRef, private rs: RunService) { }

  ngOnChanges() {
    const action = this.actionInstance.of as AppActionDefinition;
    document
      .querySelector('body').style
      .setProperty(
        '--text-stroke-color',
        tinycolor(action.styles.backgroundColor)
          .isDark() ? 'white' : 'black'
      );
    this.link();
  }

  ngOnInit() {
    if (this.actionInstance && this.actionInstance.isAppAction) {
      this.rs.registerAppAction(this.elem, {});
    }
    if (this.ioChange) {
      this.ioChange.subscribe(() => this.link());
    }
  }

  ngAfterViewInit() {
    this.instanceContainers.changes.subscribe(() => {
      const instanceContainersArr = this.instanceContainers.toArray();
      // if an action was removed we need to re-do the data layer
      if (this.lastNumActions > instanceContainersArr.length) {
        this.link();
      }
      this.lastNumActions = instanceContainersArr.length;
      // show the name of any action on the screen with size 0
      // causes changes to *ngIf so must happen in new microtask
      setTimeout(() => this.calcShowHint(instanceContainersArr));
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

  /**
   * If we don't have a consistent object, angular freaks out
   */
  get rows() {
    this._rows.length = 0;
    this._rows.push.apply(
      this._rows,
      (<AppActionDefinition>this.actionInstance.of).rows
    );
    this._rows.push(emptyRow);

    return this._rows;
  }

  /**
   * re-link when an io menu is closed
   */
  onActionMenuClosed() {
    this.link();
    // need to wait for values to propogate
    setTimeout(() => this.calcShowHint(this.instanceContainers.toArray()));
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

  /**
   * A hack to fix issues MatTabs has inside of MatMenu
   */
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

  /**
   * Get all sibling outputs / parent inputs referenced by an action
   */
  ioReferences(by: ActionInstance): Reference[] {
    if (by.id in this.ioReferencesCache) {
      return this.ioReferencesCache[by.id];
    }

    const ids = [by.id, ..._.map(by.getInputtedActions(true), (a) => a.id)];
    const resolutions: Reference[] = ids
      .map((id) => Object
        .entries(this.inReferences[id] || {})
        .map(([ioName, references]) => references
          .map((r): Reference => ({ ...r, forIO: ioName, forActionID: id }))
        )
        .flat()
      )
      .flat();
    const uniqueResolutions = _.uniqBy(
      resolutions,
      (r) => JSON.stringify([r.ioName, r.action.id, r.forIO, r.forActionID])
    );
    this.ioReferencesCache[by.id] = uniqueResolutions;

    return uniqueResolutions;
  }

  /**
   * Get all outputs of an action which are referenced in this scope
   */
  ioReferenced(
    from: ActionInstance
  ): { ioName: string }[] {
    if (from.id in this.ioReferencedCache) {
      return this.ioReferencedCache[from.id];
    }

    const ret = _.uniqBy(
      Array
        .from(this.outReferences[from.id] || [])
        .filter(({ ioName, action }) => from
          .getInputtedActions(true)
          .indexOf(action) === -1
        ),
      (r) => r.ioName
    );
    this.ioReferencedCache[from.id] = ret;

    return ret;
  }

  /**
   * Used for color-coding I/O
   * Each action x ioName combo should have a unique color
   */
  color(fromAction: ActionInstance, ioName: string): string {
    return _.get(
      this.colorAssignments,
      [fromAction.id, ioName],
      '#a9a9a9' // default, solves async issues and > 20 outputs to show
    ) as string; // the default typing is wrong
  }

  /**
   * Expose Math.max so we can use it in the template
   */
  max(...numbers: number[]): number {
    return Math.max(...numbers);
  }

  /**
   * Update references to show in the UI
   * Allocate colors to referenced parent inputs / sibling outputs
   */
  private link() {
    const { inReferences, outReferences} = findReferences(this.actionInstance);
    this.inReferences = inReferences;
    this.outReferences = outReferences;
    this.ioReferencedCache = {};
    this.ioReferencesCache = {};
    this.allocateColors();
  }

  /**
   * Allocate colors to referenced parent inputs / sibling outputs
   */
  private allocateColors() {
    // free colors assigned to IOs that are no longer referenced
    _.forOwn(this.colorAssignments, (obj, actionID) => {
      _.forOwn(obj, (color, ioName) => {
        const ios = this.outReferences[actionID] || [];
        if (!ios.find((r) => r.ioName === ioName)) {
          this.availableColors.add(color);
        }
      });
    });

    // allocate colors to new references
    this.colorAssignments = _.mapValues(
      this.outReferences,
      (ioNames, aID) => {
        const ioToColor = {};
        ioNames.forEach(({ ioName: ioN }) => {
          let color = _.get(this.colorAssignments, [aID, ioN], '');
          if (!color) {
            color = this.availableColors.values()
              .next().value; // get first color
            this.availableColors.delete(color);
          }
          ioToColor[ioN] = color;
        });

        return ioToColor;
      }
    );
  }

  /**
   * Set the showHint property on each child action
   * This property is set to true if the action is not rednering anything
   * Since actions are broken up into rows but the ViewChildren gives us
   *   one array it makes the most sense to do this all at once in a loop
   */
  private calcShowHint(instanceContainersArr: ElementRef[]) {
    let rowActions = 0;
    this.rows.forEach((row) => {
      row.actions.forEach((action, actionNum) => {
        const index = rowActions + actionNum;
        const actionContainer = instanceContainersArr[index];
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
}

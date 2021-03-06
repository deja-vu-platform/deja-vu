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
import { Router } from '@angular/router';
import { RunService } from '@deja-vu/core';
import * as _ from 'lodash';
import * as tinycolor from 'tinycolor2';

import {
  App,
  AppComponentDefinition,
  ComponentInstance,
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
  forComponentID: string;
}

export const MIN_ALPHA_FOR_DARK = 0.25;

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
  [componentID: string]: {
    [ioName: string]: string;
  };
}

@Component({
  selector: 'app-component-definition',
  templateUrl: './component-definition.component.html',
  styleUrls: ['./component-definition.component.scss']
})
export class ComponentDefinitionComponent
implements AfterViewInit, OnChanges, OnInit {
  @Input() app: App;
  @Input() componentInstance: ComponentInstance;
  @Input() dragging = false;
  @Input() showIoHints = false;

  @ViewChildren('instanceContainer')
    private instanceContainers: QueryList<ElementRef>;
  private lastNumComponents = 0;
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

  constructor(
    private elem: ElementRef, private rs: RunService,
    private readonly router: Router) { }

  ngOnChanges() {
    const component = this.componentInstance.of as AppComponentDefinition;
    const color = tinycolor(component.styles.backgroundColor);
    document
      .querySelector('body').style
      .setProperty(
        '--text-stroke-color',
        color.isDark() && color.getAlpha() > MIN_ALPHA_FOR_DARK
          ? 'white'
          : 'black'
      );
    this.updateReferences();
  }

  ngOnInit() {
    this.rs.registerAppComponent(this.elem, {});
  }

  ngAfterViewInit() {
    this.instanceContainers.changes.subscribe(() => {
      const instanceContainersArr = this.instanceContainers.toArray();

      // show the name of any component on the screen with size 0
      // causes changes to *ngIf so must happen in new microtask
      setTimeout(() => {
        // if a component was removed we need to re-do the data layer
        if (this.lastNumComponents > instanceContainersArr.length) {
          this.updateReferences();
        }
        this.lastNumComponents = instanceContainersArr.length;
        this.calcShowNoContentHint(instanceContainersArr);
        this.calcShowHiddenHint(instanceContainersArr);
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

  /**
   * If we don't have a consistent object, angular freaks out
   */
  get rows() {
    this._rows.length = 0;
    this._rows.push.apply(
      this._rows,
      (<AppComponentDefinition>this.componentInstance.of).rows
    );
    this._rows.push(emptyRow);

    return this._rows;
  }

  onComponentMenuClosed(forComponent: ComponentInstance) {
    forComponent.shouldReLink.emit();
    this.updateReferences();
    // need to wait for values to propogate
    setTimeout(() => {
      this.calcShowNoContentHint(
        this.instanceContainers.toArray());
      this.calcShowHiddenHint(
        this.instanceContainers.toArray());
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
   * Get all sibling outputs / parent inputs referenced by a component
   */
  ioReferences(by: ComponentInstance): Reference[] {
    if (by.id in this.ioReferencesCache) {
      return this.ioReferencesCache[by.id];
    }

    const ids = [by.id, ..._.map(by.getInputtedComponents(true), (a) => a.id)];
    const resolutions: Reference[] = ids
      .map((id) => Object
        .entries(this.inReferences[id] || {})
        .map(([ioName, references]) => references
          .map((r): Reference => ({ ...r, forIO: ioName, forComponentID: id }))
        )
        .flat()
      )
      .flat();
    const uniqueResolutions = _.uniqBy(
      resolutions,
      (r) => JSON.stringify([
        r.ioName, r.component.id, r.forIO, r.forComponentID])
    );
    this.ioReferencesCache[by.id] = uniqueResolutions;

    return uniqueResolutions;
  }

  /**
   * Get all outputs of a component which are referenced in this scope
   */
  ioReferenced(
    from: ComponentInstance
  ): { ioName: string }[] {
    if (from.id in this.ioReferencedCache) {
      return this.ioReferencedCache[from.id];
    }

    const ret = _.uniqBy(
      Array
        .from(this.outReferences[from.id] || [])
        .filter(({ ioName, component }) => from
          .getInputtedComponents(true)
          .indexOf(component) === -1
        ),
      (r) => r.ioName
    );
    this.ioReferencedCache[from.id] = ret;

    return ret;
  }

  /**
   * Used for color-coding I/O
   * Each component x ioName combo should have a unique color
   */
  color(fromComponent: ComponentInstance, ioName: string): string {
    return _.get(
      this.colorAssignments,
      [fromComponent.id, ioName],
      '#a9a9a9' // default, solves async issues and > 20 outputs to show
    ) as string; // the default typing is wrong
  }

  /**
   * Expose Math.max so we can use it in the template
   */
  max(...numbers: number[]): number {
    return Math.max(...numbers);
  }

  deleteRow(rowNum: number): void {
    if (window.confirm('Are you sure you want to remove this row?')) {
      (<AppComponentDefinition> this.componentInstance.of).rows
        .splice(rowNum, 1);
    }
  }

  editComponent(component: ComponentInstance) {
    this.router.navigateByUrl('/' + component.of.name);
  }

  deleteComponent(rowNum: number, componentNum: number) {
    if (window.confirm('Are you sure you want to remove this component?')) {
      (<AppComponentDefinition> this.componentInstance.of).rows[rowNum]
        .components.splice(componentNum, 1);
    }
  }

  /**
   * Update references to show in the UI
   * Allocate colors to referenced parent inputs / sibling outputs
   */
  private updateReferences() {
    const { inReferences, outReferences} =
      findReferences(this.componentInstance);
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
    _.forOwn(this.colorAssignments, (obj, componentID) => {
      _.forOwn(obj, (color, ioName) => {
        const ios = this.outReferences[componentID] || [];
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
   * Set the showNoContentHint property on each child component
   * This property is set to true if the component is not rendering anything
   * Since components are broken up into rows but the ViewChildren gives us
   *   one array it makes the most sense to do this all at once in a loop
   */
  private calcShowNoContentHint(instanceContainersArr: ElementRef[]) {
    let rowComponents = 0;
    this.rows.forEach((row) => {
      row.components.forEach((component, componentNum) => {
        const index = rowComponents + componentNum;
        const componentContainer = instanceContainersArr[index];
        const firstChild = componentContainer && componentContainer
          .nativeElement.firstElementChild.firstElementChild;
        const showNoContentHint = (
          firstChild
          && (
            firstChild.offsetHeight === 0
            || firstChild.offsetWidth === 0
          )
        );
        component['showNoContentHint'] = showNoContentHint;
      });
      rowComponents += row.components.length;
    });
  }

  private calcShowHiddenHint(instanceContainersArr: ElementRef[]) {
    this.rows.forEach((row) => {
      row.components.forEach((component: ComponentInstance, componentNum) => {
        component['showHiddenHint'] = (
          component.inputSettings['hidden'] === 'true');
      });
    });
  }
}

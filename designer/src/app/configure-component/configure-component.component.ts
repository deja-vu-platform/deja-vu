import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';
import * as _ from 'lodash';
import * as tinycolor from 'tinycolor2';

import {
  MIN_ALPHA_FOR_DARK
} from '../component-definition/component-definition.component';
import {
  App,
  AppComponentDefinition,
  AppComponentStyles,
  defaultAppComponentStyles
} from '../datatypes';

interface ControlGroup {
  form: { valid: boolean };
}

export interface DialogData {
  app: App;
  component?: AppComponentDefinition;
}

@Component({
  selector: 'app-configure-component',
  templateUrl: './configure-component.component.html',
  styleUrls: ['./configure-component.component.scss']
})
export class ConfigureComponentComponent implements OnInit {
  name: string;
  page: boolean;
  home: boolean;
  transaction: boolean;
  styles: AppComponentStyles = defaultAppComponentStyles;

  constructor(
    private readonly dialogRef: MatDialogRef<ConfigureComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogData
  ) { }

  ngOnInit() {
    if (this.data.component) {
      this.name = this.data.component.name;
      this.styles = _.cloneDeep(this.data.component.styles);
      this.page = this.componentIsPage();
      this.home = this.data.app.homepage === this.data.component;
      this.transaction = this.data.component.transaction;
    }
  }

  componentIsPage(component?: AppComponentDefinition): boolean {
    component = component ? component : this.data.component;

    return this.data.app.pages.includes(component);
  }

  makeComponentPage(component?: AppComponentDefinition) {
    component = component ? component : this.data.component;
    if (!this.componentIsPage(component)) {
      this.data.app.pages.push(component);
    }
  }

  makeComponentNotPage(component?: AppComponentDefinition) {
    component = component ? component : this.data.component;
    _.remove(this.data.app.pages, (p) => p === component);
  }

  validate(form: ControlGroup) {
    return form.form.valid;
  }

  cancel() {
    this.dialogRef.close();
  }

  delete() {
    this.data.app.components.forEach((ad) => {
      ad.rows.forEach((r) => {
        _.remove(r.components, (ai) => (
          ai.of === this.data.component
          && ai.from === this.data.app
        ));
      });
    });
    _.remove(this.data.app.components, (ad) => ad === this.data.component);
    this.dialogRef.close();
  }

  save() {
    let component: AppComponentDefinition;

    if (this.data.component) {
      component = this.data.component;
      component.name = this.name;
    } else {
      component = new AppComponentDefinition(this.name);
      const insertIdx = _
        .sortedIndexBy(this.data.app.components, component, 'name');
      this.data.app.components.splice(insertIdx, 0, component);
    }

    if (this.page) {
      this.makeComponentPage(component);
    } else {
      this.makeComponentNotPage(component);
    }

    component.transaction = this.transaction;

    Object.assign(component.styles, this.styles);
    const color = tinycolor(this.styles.backgroundColor);
    document
      .querySelector('body').style
      .setProperty(
        '--text-stroke-color',
        color.isDark() && color.getAlpha() > MIN_ALPHA_FOR_DARK
          ? 'white'
          : 'black'
      );

    this.dialogRef.close();
  }

  makeHomepage() {
    this.makeComponentPage();
    this.data.app.homepage = this.data.component;
  }

  /**
   * you can delete the component
   * as long as it is not the only component
   * or the homepage
   */
  get canDelete() {
    return (
      this.data.app.components.length > 1
      && this.data.app.homepage !== this.data.component
    );
  }

}

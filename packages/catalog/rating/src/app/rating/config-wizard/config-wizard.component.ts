import { Component, Input, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/**
 * Config Wizard is used by the Designer to configure the cliche.
 * This cliche requires no configuration, so an empty component is provided
 *   to prevent the Designer from rendering a JSON input by default.
 * If that ever changes, you should either update this component (preferred)
 *   or remove it.
 */
@Component({
  templateUrl: './config-wizard.component.html',
  styleUrls: ['./config-wizard.component.css']
})
export class ConfigWizardComponent {
  /**
   * JSON string; initial configuration
   */
  @Input() readonly value: string;
  /**
   * JSON string; new configuration; falsy means invalid
   */
  @Output() readonly change = new BehaviorSubject<string>('{}');
}

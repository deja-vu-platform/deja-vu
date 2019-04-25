import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';

/**
 * Config Wizard is used by the Designer to configure the cliche.
 */
@Component({
  selector: 'transfer-config-wizard',
  templateUrl: './config-wizard.component.html',
  styleUrls: ['./config-wizard.component.css']
})
export class ConfigWizardComponent implements OnInit {
  /**
   * JSON string; initial configuration
   */
  @Input() readonly value: string;
  /**
   * JSON string; new configuration; falsy means invalid
   */
  @Output() readonly change = new EventEmitter<string>();
  balanceType: 'money' | 'items' = 'items';

  ngOnInit() {
    if (this.value) { // guaranteed to be from us if defined
      this.balanceType = JSON.parse(this.value).balanceType;
    }
    this.change.emit(this.configJSON);
  }

  onChange(event: MatRadioChange) {
    this.balanceType = event.value;
    this.change.emit(this.configJSON);
  }

  private get configJSON() {
    return `{"balanceType":"${this.balanceType}"}`;
  }
}

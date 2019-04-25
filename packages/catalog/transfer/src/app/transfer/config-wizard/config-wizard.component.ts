import { Component, Input, OnInit, Output } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

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
  @Output() readonly change = new BehaviorSubject<string>(this.configJSON);
  balanceType: 'money' | 'items' = 'items';

  ngOnInit() {
    if (this.value) { // guaranteed to by from us if defined
      this.balanceType = JSON.parse(this.value).balanceType;
    }
  }

  onChange(event: MatRadioChange) {
    this.balanceType = event.value;
    this.change.next(this.configJSON);
  }

  private get configJSON() {
    return `{"balanceType":"${this.balanceType}"}`;
  }
}

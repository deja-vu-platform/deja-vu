import {
  ChangeDetectorRef, Component, ElementRef, OnInit, OnChanges, Output,
  Input, EventEmitter, SimpleChanges
} from '@angular/core';

import { RunService, OnRun, OnAfterCommit } from './run.service';

import { take, filter } from 'rxjs/operators';

import * as _ from 'lodash';


@Component({
  selector: 'dv-merge',
  template: ``
})
export class MergeComponent
implements OnInit, OnChanges, OnRun, OnAfterCommit {
  @Input() sources: any[] = [];
  sourcesChange = new EventEmitter<any[]>();
  @Output() object = new EventEmitter<any>();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private ref: ChangeDetectorRef) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes: SimpleChanges) {
    // https://stackoverflow.com/questions/34364880/expression-has-changed-after-it-was-checked
    // The statement below is needed to suppress the error described above.
    this.ref.detectChanges();
    if (changes.sources) {
      this.sourcesChange.emit(changes.sources.currentValue);
    }
  }

  async dvOnRun() {
    if (!this.isReady(this.sources)) {
      await this.sourcesChange.asObservable()
        .pipe(filter(this.isReady), take(1))
        .toPromise();
    }
    this.object.emit(_.merge(...this.sources));
  }

  dvOnAfterCommit() {
    this.sources = [];
  }

  isReady(sources: any[]) {
    return !_.isEmpty(_.compact(sources));
  }
}

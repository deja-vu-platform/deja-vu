import {
  ChangeDetectorRef, Component, ElementRef, OnInit, OnChanges, Output,
  Input, EventEmitter, SimpleChanges
} from '@angular/core';

import { RunService, OnExec, OnExecSuccess } from '../run.service';

import { take, filter } from 'rxjs/operators';

import * as _ from 'lodash';


@Component({
  selector: 'dv-merge',
  templateUrl: './merge.component.html'
})
export class MergeComponent
implements OnInit, OnChanges, OnExec, OnExecSuccess {
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

  async dvOnExec() {
    if (!this.isReady(this.sources)) {
      await this.sourcesChange.asObservable()
        .pipe(filter(this.isReady), take(1))
        .toPromise();
    }
    this.object.emit(_.merge(...this.sources));
  }

  dvOnExecSuccess() {
    this.sources = [];
  }

  isReady(sources: any[]) {
    return !_.isEmpty(_.compact(sources));
  }
}

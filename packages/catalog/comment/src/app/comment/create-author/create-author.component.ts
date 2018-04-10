import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Author } from '../shared/comment.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'comment-create-author',
  templateUrl: './create-author.component.html',
  styleUrls: ['./create-author.component.css']
})
export class CreateAuthorComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create Author';
  @Input() inputLabel = 'Author Id';
  @Input() newAuthorSavedText = 'New author saved';

  @Output() author: EventEmitter<Author> = new EventEmitter<Author>();

  newAuthorSaved = false;
  newAuthorError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { createAuthor: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
          createAuthor(id: "${this.id}") {
            id
          }
        }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
    this.author.emit({ id: res.data.createAuthor.id });
  }

  dvOnAfterCommit() {
    this.newAuthorSaved = true;
    this.newAuthorError = '';
    window.setTimeout(() => {
      this.newAuthorSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newAuthorError = reason.message;
  }
}

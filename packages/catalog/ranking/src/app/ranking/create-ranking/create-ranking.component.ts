import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Type, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  Action, GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from 'dv-core';


import * as _ from 'lodash';

import { ShowTargetComponent } from '../show-target/show-target.component';

import { API_PATH } from '../ranking.config';
import { Ranking, TargetRank } from '../shared/ranking.model';

interface CreateRankingInput {
  id?: string;
  sourceId?: string;
  targets: TargetRank[];
}

interface CreateRankingResponse {
  data: { createRanking: Ranking };
  errors: {message: string}[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'ranking-create-ranking',
  templateUrl: './create-ranking.component.html',
  styleUrls: ['./create-ranking.component.css']
})
export class CreateRankingComponent
    implements OnInit, OnExec, OnExecSuccess, OnExecFailure  {
  @Input() id: string | undefined;
  @Input() sourceId: string | undefined;
  @Input() targetIds: string[];
  @Input() showOptionToSubmit = true;
  @Input() save = true;
  @Output() ranking = new EventEmitter();

  // Presentation inputs
  @Input() showTargetId = true;
  @Input() showTargetRank = true;
  @Input() targetRankLabel = 'Rank: ';
  @Input() buttonLabel = 'Create';
  @Input() newRankingSavedText = 'New ranking saved';

  @Input() showTarget: Action = {
    type: <Type<Component>> ShowTargetComponent
  };

  newRankingSaved = false;
  newRankingError: string;
  dragContainer = 'drag-container';
  createRanking;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {
    this.createRanking = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    if (!this.canExec()) {
      return;
    }
    const newRanking: CreateRankingInput = {
      id: this.id,
      sourceId: this.sourceId,
      targets: this.targetIds.map((targetId, index) => {
        return {
          id: targetId,
          rank: index + 1
        };
      })
    };
    if (this.save) {
      const res = await this.gs
        .post<CreateRankingResponse>(this.apiPath, {
          inputs: {
            input: newRanking
          },
          extraInfo: { returnFields: 'id' }
        })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
      newRanking.id = res.data.createRanking.id;
    }

    this.ranking.emit(newRanking);
  }

  dvOnExecSuccess() {
    if (this.showOptionToSubmit && this.save) {
      this.newRankingSaved = true;
      this.newRankingError = '';
      window.setTimeout(() => {
        this.newRankingSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newRankingError = reason.message;
    }
  }

  private canExec() {
    return !_.isNil(this.targetIds);
  }
}

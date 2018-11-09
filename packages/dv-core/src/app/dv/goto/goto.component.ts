import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'dv-goto',
  templateUrl: './goto.component.html'
})
export class GotoComponent implements OnInit {
  @Output() goto = new EventEmitter<string>();

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.has('goto'))
        this.goto.emit(params.get('goto'));
    });
  }
}

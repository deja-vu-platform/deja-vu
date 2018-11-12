import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'dv-callback',
  templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit {
  @Output() callback = new EventEmitter<string>();

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      if (params.has('callback'))
        this.callback.emit(params.get('callback'));
    });
  }
}

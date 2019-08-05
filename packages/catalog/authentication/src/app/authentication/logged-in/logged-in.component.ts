import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output
} from '@angular/core';
import { RunService, StorageService } from '@deja-vu/core';


@Component({
  selector: 'authentication-logged-in',
  templateUrl: './logged-in.component.html'
})
export class LoggedInComponent implements OnInit, AfterViewInit {
  @Output() user = new EventEmitter();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private ss: StorageService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.rs.eval(this.elem);
    });
  }

  async dvOnEval(): Promise<void> {
    const user = this.ss.getItem(this.elem, 'user');
    if (user) {
      this.user.emit(user);
    } else {
      this.user.emit(null);
      throw new Error('No user is logged in');
    }
  }
}

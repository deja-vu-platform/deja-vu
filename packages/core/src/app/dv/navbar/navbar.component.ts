import { Component, ElementRef, OnInit } from '@angular/core';
import { RunService } from '../run.service';

/** This class is defined for designer
 * to use <nav> instead of <div> as a navbar.
 * It is a good practice and helps apply the themes.
 */
@Component({
  selector: 'dv-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }
}

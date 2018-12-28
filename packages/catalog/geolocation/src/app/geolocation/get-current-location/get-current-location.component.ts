import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output
} from '@angular/core';
import { RunService } from 'dv-core';

import { Location } from '../shared/geolocation.model';

@Component({
  selector: 'geolocation-get-current-location',
  templateUrl: './get-current-location.component.html',
  styleUrls: ['./get-current-location.component.css']
})
export class GetCurrentLocationComponent implements OnInit, AfterViewInit {
  @Output() location: EventEmitter<Location> = new EventEmitter<Location>();

  constructor(private elem: ElementRef, private rs: RunService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.rs.eval(this.elem);
    });
  }

  async dvOnEval(): Promise<void> {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const l: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      },
      (error) => {
        throw new Error(error.message);
      }
    );
  }

}

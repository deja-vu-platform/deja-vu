import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent {
  @Input() show;
}

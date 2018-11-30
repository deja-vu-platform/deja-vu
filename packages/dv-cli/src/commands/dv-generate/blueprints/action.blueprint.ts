import { Component, OnInit, ElementRef, Renderer2, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GatewayService, GATEWAY_URL } from 'dv-core';

@Component({
  selector: 'cl-foo',
  templateUrl: './foo.component.html',
  styleUrls: ['./foo.component.css']
})
export class FooComponent implements OnInit {
  gs: GatewayService;

  constructor(
    @Inject(GATEWAY_URL) gatewayUrl: string,
    http: HttpClient, elem: ElementRef, renderer: Renderer2) {
    this.gs = new GatewayService(gatewayUrl, http, renderer, elem);
  }

  ngOnInit() {
    this.gs.get('/graphql', { params: { foo: 'bar' }}).subscribe(res => {
      console.log(res);
    });
  }

}

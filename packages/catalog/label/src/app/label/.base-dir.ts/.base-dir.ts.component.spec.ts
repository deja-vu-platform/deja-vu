import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { .BaseDir.TsComponent } from './.base-dir.ts.component';

describe('.BaseDir.TsComponent', () => {
  let component: .BaseDir.TsComponent;
  let fixture: ComponentFixture<.BaseDir.TsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ .BaseDir.TsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(.BaseDir.TsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

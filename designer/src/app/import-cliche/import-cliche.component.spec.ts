import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportClicheComponent } from './import-cliche.component';

describe('ImportClicheComponent', () => {
  let component: ImportClicheComponent;
  let fixture: ComponentFixture<ImportClicheComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImportClicheComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportClicheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});

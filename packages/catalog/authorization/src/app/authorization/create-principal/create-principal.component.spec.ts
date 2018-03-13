import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePrincipalComponent } from './create-principal.component';

describe('CreatePrincipalComponent', () => {
  let component: CreatePrincipalComponent;
  let fixture: ComponentFixture<CreatePrincipalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatePrincipalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePrincipalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});

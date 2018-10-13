import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePasskeyComponent } from './create-passkey.component';

describe('CreatePasskeyComponent', () => {
  let component: CreatePasskeyComponent;
  let fixture: ComponentFixture<CreatePasskeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatePasskeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePasskeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateObjectsComponent } from './create-objects.component';

describe('CreateObjectsComponent', () => {
  let component: CreateObjectsComponent;
  let fixture: ComponentFixture<CreateObjectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateObjectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateObjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

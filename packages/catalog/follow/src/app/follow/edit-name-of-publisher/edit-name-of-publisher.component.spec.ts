import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNameOfPublisherComponent } from './edit-name-of-publisher.component';

describe('EditNameOfPublisherComponent', () => {
  let component: EditNameOfPublisherComponent;
  let fixture: ComponentFixture<EditNameOfPublisherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditNameOfPublisherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNameOfPublisherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditContentOfMessageComponent } from './edit-content-of-message.component';

describe('EditContentOfMessageComponent', () => {
  let component: EditContentOfMessageComponent;
  let fixture: ComponentFixture<EditContentOfMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditContentOfMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditContentOfMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetComponent } from '../widget/widget.component';
import { RowComponent } from './row.component';

describe('RowComponent', () => {
  let component: RowComponent;
  let fixture: ComponentFixture<RowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        RowComponent,
        WidgetComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});

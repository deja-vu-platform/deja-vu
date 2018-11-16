import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageComponent } from '../page/page.component';
import { RowComponent } from '../row/row.component';
import { WidgetComponent } from '../widget/widget.component';
import { MainViewComponent } from './main-view.component';

describe('MainViewComponent', () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        MainViewComponent,
        PageComponent,
        RowComponent,
        WidgetComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});

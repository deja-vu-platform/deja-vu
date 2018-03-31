import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowPartiesComponent } from './show-parties.component';

describe('ShowPartiesComponent', () => {
  let component: ShowPartiesComponent;
  let fixture: ComponentFixture<ShowPartiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowPartiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowPartiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

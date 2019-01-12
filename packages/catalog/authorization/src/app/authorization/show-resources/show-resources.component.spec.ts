import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowResourcesComponent } from './show-resources.component';

describe('ShowResourcesComponent', () => {
  let component: ShowResourcesComponent;
  let fixture: ComponentFixture<ShowResourcesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShowResourcesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});

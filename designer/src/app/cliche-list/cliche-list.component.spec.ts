import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClicheListComponent } from './cliche-list.component';

describe('ClicheListComponent', () => {
  let component: ClicheListComponent;
  let fixture: ComponentFixture<ClicheListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ClicheListComponent],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClicheListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

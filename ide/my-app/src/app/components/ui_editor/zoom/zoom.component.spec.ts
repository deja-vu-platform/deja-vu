import { TestBed, async } from '@angular/core/testing';
import { ZoomComponent } from './zoom.component';

describe('ZoomComponent', () => {
  let fixture;
  let zoom;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ZoomComponent
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ZoomComponent);
    zoom = fixture.debugElement.componentInstance;
  }));
  it('should create the zoom control', async(() => {
    expect(zoom).toBeTruthy();
  }));
});

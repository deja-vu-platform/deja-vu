import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetCurrentLocationComponent } from './get-current-location.component';

import { config } from '../testing/testbed.config';


describe('GetCurrentLocationComponent', () => {
  let component: GetCurrentLocationComponent;
  let fixture: ComponentFixture<GetCurrentLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule(config)
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetCurrentLocationComponent);
    component = fixture.componentInstance;
    window.navigator['__defineGetter__']('geolocation', () => {
      return {
        getCurrentPosition: (l) => {
          l({
            coords: {
              latitude: 42,
              longitude: 71
            }
          });
        }
      };
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component)
      .toBeTruthy();
  });
});

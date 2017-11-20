import { TestBed, async } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
describe('HeaderComponent', () => {
  let fixture;
  let header;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        HeaderComponent
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    header = fixture.debugElement.componentInstance;
  }));
  it('should create the header', async(() => {
    expect(header).toBeTruthy();
  }));
});

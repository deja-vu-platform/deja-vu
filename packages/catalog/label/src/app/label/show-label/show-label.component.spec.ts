import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowLabelComponent } from './show-label.component';

describe('ShowLabelComponent', () => {
    let component: ShowLabelComponent;
    let fixture: ComponentFixture<ShowLabelComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ShowLabelComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ShowLabelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component)
            .toBeTruthy();
    });
});

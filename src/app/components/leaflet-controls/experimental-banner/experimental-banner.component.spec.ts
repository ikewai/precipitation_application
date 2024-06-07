import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentalBannerComponent } from './experimental-banner.component';

describe('ExperimentalBannerComponent', () => {
  let component: ExperimentalBannerComponent;
  let fixture: ComponentFixture<ExperimentalBannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentalBannerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentalBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

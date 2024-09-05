import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetTabComponent } from './dataset-tab.component';

describe('DatasetTabComponent', () => {
  let component: DatasetTabComponent;
  let fixture: ComponentFixture<DatasetTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatasetTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatasetTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

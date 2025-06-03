import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZebraComponent } from './zebra.component';

describe('ZebraComponent', () => {
  let component: ZebraComponent;
  let fixture: ComponentFixture<ZebraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZebraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZebraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

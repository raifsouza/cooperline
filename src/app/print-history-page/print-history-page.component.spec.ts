import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintHistoryPageComponent } from './print-history-page.component';

describe('PrintHistoryPageComponent', () => {
  let component: PrintHistoryPageComponent;
  let fixture: ComponentFixture<PrintHistoryPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintHistoryPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintHistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

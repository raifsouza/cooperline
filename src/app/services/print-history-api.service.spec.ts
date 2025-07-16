import { TestBed } from '@angular/core/testing';

import { PrintHistoryApiService } from './print-history-api.service';

describe('PrintHistoryApiService', () => {
  let service: PrintHistoryApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrintHistoryApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

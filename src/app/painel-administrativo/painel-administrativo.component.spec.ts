import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelAdministrativoComponent } from './painel-administrativo.component';

describe('PainelAdministrativoComponent', () => {
  let component: PainelAdministrativoComponent;
  let fixture: ComponentFixture<PainelAdministrativoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelAdministrativoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelAdministrativoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

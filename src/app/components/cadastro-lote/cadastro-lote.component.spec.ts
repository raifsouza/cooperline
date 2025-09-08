import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroLoteComponent } from './cadastro-lote.component';

describe('CadastroLoteComponent', () => {
  let component: CadastroLoteComponent;
  let fixture: ComponentFixture<CadastroLoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroLoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroLoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

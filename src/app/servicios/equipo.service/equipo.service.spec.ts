import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EquipoService } from './equipo.service';

describe('EquipoService', () => {
  let component: EquipoService;
  let fixture: ComponentFixture<EquipoService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipoService],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipoService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

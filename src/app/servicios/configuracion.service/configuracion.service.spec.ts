import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionService } from './configuracion.service';

describe('ConfiguracionService', () => {
  let component: ConfiguracionService;
  let fixture: ComponentFixture<ConfiguracionService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracionService],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

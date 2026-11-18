import { Empresa } from './empresa';

describe('Empresa Model', () => {
  it('should create an empresa object successfully', () => {
    const empresa: Empresa = {
      id: 1,
      nombre: 'SystemBase S.A.C.',
      ruc: '20123456789'
    };

    expect(empresa).toBeTruthy();
    expect(empresa.nombre).toBe('SystemBase S.A.C.');
    expect(empresa.ruc).toBe('20123456789');
  });
});
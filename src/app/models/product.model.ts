// src/app/models/product.model.ts
export interface Product {
  id?: number;
  codigo: string;
  nomeLinha1?: string;
  nomeLinha2?: string;
  nomeLinha3?: string;
  nomeLinha4?: string;
  nomeLinha5?: string;
  nomeLinha6?: string;
  tamanhoPadrao: string;
  designacao: string;
  tensao: string;
  massaBrutaKg100m: number;
  normaAplicada: string;
  composicao: string;
  numeroRegistro: string;
  codBarras: string;
  pedidoOc?: string | null;
  retalho?: string | null;
  massaLiquidaKg100m: number;
}
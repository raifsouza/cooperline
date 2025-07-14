// src/app/models/product.model.ts
export interface Product {
  id?: number;
  codigo: string;
  nomeProduto: string;
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
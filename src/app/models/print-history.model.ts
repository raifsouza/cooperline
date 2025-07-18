// src/app/models/print-history.model.ts
export interface PrintHistoryEntry {
  id?: number; // Opcional, será gerado pelo banco de dados
  userId: string; // Se for o ID interno do usuário
  userName: string;
  timestamp: string;
  printerName: string;
  copies: number;
  labelName?: string | null;
  productCode?: string | null;
  productName?: string | null;
  productLote?:string | null; // Nome do produto associado à etiqueta
  reprint:boolean
  // zplContentSent?: string; // O ZPL exato que foi enviado (útil para depuração/auditoria)
}
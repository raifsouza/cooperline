// src/app/models/print-history.model.ts
export interface PrintHistoryEntry {
  id?: number; // Opcional, será gerado pelo banco de dados
  userId: string; // Se for o ID interno do usuário
  userName: string;
  userMatricula: string; // <--- Certifique-se que este campo existe ou adicione-o
  timestamp: string;
  printerName: string;
  copies: number;
  labelName: string;
  // Adicione outros campos relevantes se necessário, como:
  // productName?: string; // Nome do produto associado à etiqueta
  // zplContentSent?: string; // O ZPL exato que foi enviado (útil para depuração/auditoria)
}
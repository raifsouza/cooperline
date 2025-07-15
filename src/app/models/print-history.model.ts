// src/app/models/print-history.model.ts
export interface PrintHistoryEntry {
  userId: string;
  userName: string; // Adicionado para armazenar o nome do usuário
  timestamp: string;
  printerName: string;
  copies: number;
  labelName?: string;
  // zplContent?: string; // Manter opcional se necessário para o DB
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LabelaryService {
  private readonly BASE_URL = 'https://api.labelary.com/v1/printers';
  private readonly GRAPHICS_URL = 'https://api.labelary.com/v1/graphics';

  constructor(private http: HttpClient) { }

  /**
   * Converte uma imagem (File ou Blob) em uma string ZPL ^GFA.
   * @param imageFile O objeto File ou Blob da imagem.
   * @returns Um Observable de string, representando o ZPL ^GFA gerado.
   */
  convertImageToZPL(imageFile: File | Blob): Observable<string> {
    const formData = new FormData();
    formData.append('file', imageFile); // 'file' é o nome do parâmetro esperado pela API

    const headers = new HttpHeaders({
      // 'Content-Type' é definido automaticamente pelo HttpClient para FormData
      // 'Accept': 'application/zpl' // Opcional, mas boa prática para indicar que esperamos ZPL
    });

    return this.http.post(this.GRAPHICS_URL, formData, { headers, responseType: 'text' }); // Resposta é texto (ZPL)
  }

  /**
   * Renders a ZPL string into an image.
   * @param zpl The ZPL string to render.
   * @param dpmm Dots per millimeter (e.g., 8 for 203dpi, 12 for 300dpi).
   * @param width Width of the label in inches.
   * @param height Height of the label in inches.
   * @param index (Optional) Index for multiple labels in a single ZPL string (defaults to 0).
   * @returns An Observable of type Blob, representing the image.
   */
  renderLabel(
    zpl: string,
    dpmm: number,
    width: number,
    height: number,
    index: number = 0
  ): Observable<Blob> {

    const url = `${this.BASE_URL}/${dpmm}dpmm/labels/${width}x${height}/${index}/`;

    const headers = new HttpHeaders({
      // Mude esta linha:
      'Content-Type': 'application/x-www-form-urlencoded' // <-- ESSENCIAL: O Labelary espera texto puro aqui.
    });

    // O corpo da requisição (zpl) está correto sendo a string pura.
    return this.http.post(url, zpl, { headers, responseType: 'blob' });
  }
}
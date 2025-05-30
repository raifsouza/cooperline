import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs'; // Importe BehaviorSubject
import { tap } from 'rxjs/operators'; // Importe tap

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';

  // BehaviorSubject para armazenar o nome do usuário logado
  // Começa com null, indicando que ninguém está logado
  
  private _userName = new BehaviorSubject<string | null>(null);
  public readonly userName$ = this._userName.asObservable(); // Observable público

  constructor(private http: HttpClient,@Inject(PLATFORM_ID) private platformId: Object) {
    // Ao iniciar o serviço, tente carregar o nome do usuário do localStorage
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      this._userName.next(storedUserName);
    }
  }

  
  login(matricula: string, senha: string): Observable<any> {
    return this.http.post(this.apiUrl, { matricula, senha }).pipe(
      tap((response: any) => {
        if (response && response.user && response.user.nome) {
          // Armazena o nome do usuário no BehaviorSubject e no localStorage
          this._userName.next(response.user.nome);
          localStorage.setItem('userName', response.user.nome);
          // Opcional: armazenar token, nível de acesso, etc.
        }
      })
    );
  }

  logout(): void {
    // Limpa o nome do usuário e remove do localStorage
    this._userName.next(null);
    localStorage.removeItem('userName');
    // Opcional: remover token, etc.
  }

  // Método para verificar se o usuário está logado (opcional, mas útil para guards)
  isLoggedIn(): boolean {
    return this._userName.getValue() !== null;
  }
}
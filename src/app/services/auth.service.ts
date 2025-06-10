import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, ReplaySubject, EMPTY, of } from 'rxjs'; // Importe BehaviorSubject
import { tap, first, map, switchMap, catchError, filter } from 'rxjs/operators'; // Importe tap
import { isPlatformBrowser } from '@angular/common';
import { response, Router } from 'express';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';
  // _userName deve começar refletindo a ausência de usuário até ser carregado
  private _userName = new BehaviorSubject<string | null>(null); // BehaviorSubject para armazenar o nome do usuário logado. Começa com null, indicando que ninguém está logado
  private _userAccessLevel = new BehaviorSubject<number | null>(null); //BehaviorSubject para armazena nível de acesso do usuário

  public readonly userName$ = this._userName.asObservable(); // Observable público
  public readonly userAccessLevel$ = this._userAccessLevel.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUserName = localStorage.getItem('userName');
      const storedAccessLevel = localStorage.getItem('userAccessLevel');

      if (storedUserName) this._userName.next(storedUserName);
      if (storedAccessLevel) this._userAccessLevel.next(Number(storedAccessLevel));
    }
  }

  login(nome: string, senha: string): Observable<any> {
    return this.http.post(this.apiUrl, { nome, senha }).pipe(
      tap((response: any) => {
        if (response && response.user && response.user.nome && response.user.nivel_acesso) {
          this._userName.next(response.user.nome);
          this._userAccessLevel.next(response.user.nivel_acesso);

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('userName', response.user.nome);
            localStorage.setItem('userAccessLevel', response.user.nivel_acesso);
          }
        }
      })
    );
  }

  logout(): void {
    this._userName.next(null);
    this._userAccessLevel.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userName');
      localStorage.removeItem('userAccessLevel');
    }
  }

  // Método para verificar se o usuário está logado
  //  (opcional, mas útil para guards)
  isLoggedIn_sync(): boolean {
    // return this._userName.getValue() !== null;
    const isLoggedInResult = this._userName.getValue() !== null;
    console.log(`AuthService.isLoggedIn() called. _userName value:, ${this._userName.getValue()}, Result:, ${isLoggedInResult}`);
    return isLoggedInResult;
  }

  isUserLoggerIn(): Observable<boolean> {
    return this.userName$.pipe(
      map(userName => !!userName)
    );
  }

   getAccessLevel(): number | null {
    return this._userAccessLevel.getValue();
  }

}

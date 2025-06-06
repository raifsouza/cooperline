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
  public readonly userName$ = this._userName.asObservable(); // Observable público

  // Sinaliza que a tentativa de carregar do localStorage foi feita.
  private _hydrationAttempted = new ReplaySubject<boolean>(1);

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    console.log('AuthService constructor. IsPlatformBrowser:', isPlatformBrowser(this.platformId));
    // Ao iniciar o serviço, tente carregar o nome do usuário do localStorage
      if (isPlatformBrowser(this.platformId)){
        try{
          const storedUserName = localStorage.getItem('userName')
          console.log('[AuthService] localStorage.getItem("userName") RESULT:', storedUserName);
          if (storedUserName) {
            this._userName.next(storedUserName);
            console.log('[AuthService] _userName EMITTED from localStorage:', storedUserName);
          } else {
            console.log('[AuthService] No userName in localStorage. _userName remains:', this._userName.getValue());
          }
        } catch (e) {
          console.error('[AuthService] Error accessing localStorage:', e);
        }
      } else {
        console.log('[AuthService] Not a browser platform, skipping localStorage.');
      }
      this._hydrationAttempted.next(true);
      this._hydrationAttempted.complete();
      console.log('[AuthService] Constructor END - _hydrationAttempted emitted. Final initial _userName value:', this._userName.getValue());
    }


  login(matricula: string, senha: string): Observable<any> {
    console.log('[AuthService] login() called with matricula:', matricula);
    return this.http.post(this.apiUrl, { matricula, senha }).pipe(
      tap({
        next: (response: any) => {
          if (response && response.user && response.user.nome) {
            console.log('[AuthService.login] Success. Setting userName:', response.user.nome);
            this._userName.next(response.user.nome);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('userName', response.user.nome);
              console.log('[AuthService.login] userName SET in localStorage');
            }
          } else {
            console.warn('[AuthService.login] Success but no user.nome in response:', response);
          }
        },
        error: (err) => console.error('[AuthService.login] HTTP Error', err)
      })
      // tap((response: any) => {
      //   if (response && response.user && response.user.nome) {
      //     console.log('AuthService.login() success. Setting userName:', response.user.nome);
      //     // Armazena o nome do usuário no BehaviorSubject e no localStorage
      //     this._userName.next(response.user.nome);
      //     if (isPlatformBrowser(this.platformId)) {
      //       localStorage.setItem('userName', response.user.nome);
      //       console.log('AuthService.login() - userName set in localStorage');
      //       // Opcional: armazenar token, nível de acesso, etc.
    );
  }

  logout(): void {
    console.log('AuthService.logout() called.');
    // Limpa o nome do usuário e remove do localStorage
    this._userName.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userName');
      console.log('AuthService.logout() - userName removed from localStorage.');
    // Opcional: remover token, etc.
    }
    console.log('[AuthService.logout] _userName is now:', this._userName.getValue());
  }

  // Método para verificar se o usuário está logado
  //  (opcional, mas útil para guards)
  isLoggedIn_sync(): boolean {
    // return this._userName.getValue() !== null;
    const isLoggedInResult = this._userName.getValue() !== null;
    console.log(`AuthService.isLoggedIn() called. _userName value:, ${this._userName.getValue()}, Result:, ${isLoggedInResult}`);
    return isLoggedInResult;
  }

  getAuthenticationState(): Observable<boolean> {
    console.log('[AuthService] getAuthenticationState() CALLED.');
    return this._hydrationAttempted.pipe(
      filter(attempted => attempted), // Espera _hydrationAttempted ser true
      first(), // Pega apenas o primeiro true e completa esta parte do pipe
      tap(() => console.log('[AuthService.getAuthenticationState] Hydration attempt completed.')),
      switchMap(() => {
        console.log(`[AuthService.getAuthenticationState] Subscribing to userName$. Current value: ${this._userName.getValue()}`);
        return this.userName$; // Agora observa o BehaviorSubject _userName
      }),
      map(userName => {
        const isLoggedIn = userName !== null;
        console.log(`[AuthService.getAuthenticationState] userName$ emitted '${userName}'. isLoggedIn: ${isLoggedIn}`);
        return isLoggedIn;
      }),
      // Não usar first() aqui se você quer que o guard reaja a mudanças no login state (ex: logout)
      // Mas para CanActivate, geralmente você quer uma decisão única no momento do acesso.
      // Se o BehaviorSubject emite o valor correto na primeira vez após a hidratação, está ok.
      // Adicionar um first() aqui garante que o guard não fique "escutando" indefinidamente se não for necessário.
      first(),
      tap(finalDecision => console.log(`[AuthService.getAuthenticationState] FINAL DECISION for guard: ${finalDecision}`)),
      catchError(err => {
        console.error('[AuthService.getAuthenticationState] Error:', err);
        return of(false); // Em caso de erro no pipe, considera não logado.
      })
    );
  }

}

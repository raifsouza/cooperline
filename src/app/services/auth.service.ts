// src/app/services/auth.service.ts
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/login';
  private _userName = new BehaviorSubject<string | null>(null);
  private _userAccessLevel = new BehaviorSubject<number | null>(null);
  private _userId = new BehaviorSubject<string | null>(null); // MANTIDO: _userId

  public readonly userName$ = this._userName.asObservable();
  public readonly userAccessLevel$ = this._userAccessLevel.asObservable();
  public readonly userId$ = this._userId.asObservable(); // MANTIDO: userId$
  // REMOVIDO: public readonly userMatricula$ = this._userMatricula.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUserName = localStorage.getItem('userName');
      const storedAccessLevel = localStorage.getItem('userAccessLevel');
      const storedUserId = localStorage.getItem('userId'); // MANTIDO: storedUserId

      if (storedUserName) this._userName.next(storedUserName);
      if (storedAccessLevel) this._userAccessLevel.next(Number(storedAccessLevel));
      if (storedUserId) this._userId.next(storedUserId); // MANTIDO: if (storedUserId)
    }
  }

  login(nome: string, senha: string): Observable<any> {
    return this.http.post(this.apiUrl, { nome, senha }).pipe(
      tap((response: any) => {
        if (response && response.user && response.user.nome && response.user.nivel_acesso && response.user.id) {
          this._userName.next(response.user.nome);
          this._userAccessLevel.next(response.user.nivel_acesso);
          this._userId.next(response.user.id.toString()); // MANTIDO: this._userId.next

          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('userName', response.user.nome);
            localStorage.setItem('userAccessLevel', response.user.nivel_acesso.toString());
            localStorage.setItem('userId', response.user.id.toString()); // MANTIDO: localStorage.setItem('userId')
          }
        }
      })
    );
  }

  logout(): void {
    this._userName.next(null);
    this._userAccessLevel.next(null);
    this._userId.next(null); // MANTIDO: _userId.next(null)

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userName');
      localStorage.removeItem('userAccessLevel');
      localStorage.removeItem('userId'); // MANTIDO: localStorage.removeItem('userId')
    }
  }

  isLoggedIn_sync(): boolean {
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

  getUserId(): string | null { // MANTIDO: getUserId()
    return this._userId.getValue();
  }

  getUserName(): string | null {
    return this._userName.getValue();
  }
}
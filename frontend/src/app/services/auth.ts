import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs'; // <--- IMPORT MANQUANT CORRIGÉ

@Injectable({ providedIn: 'root' })
export class AuthService {
  // On harmonise le nom : on garde 'apiUrl' pour correspondre à ta fonction register
  private apiUrl = 'http://localhost:8000/api';

  private http = inject(HttpClient); // Syntaxe moderne inject()

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data);
  }

  // auth.service.ts
// Dans auth.service.ts
register(user: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, {
    name: user.nom,      // <--- Doit être 'name'
    email: user.email,
    password: user.password,
    password_confirmation: user.password // <--- Souvent obligatoire !
  });
}

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Pense à vider l'utilisateur aussi
  }
}
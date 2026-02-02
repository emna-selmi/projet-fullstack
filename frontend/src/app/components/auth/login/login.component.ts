import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-box">
        <div class="logo">Centre Nationale de l'Informatique </div>
        <h2>Connexion</h2>
        <p>Système de Gestion de Projets</p>
        
        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Adresse Email</label>
            <input 
              type="email" 
              [(ngModel)]="creds.email" 
              name="email" 
              placeholder="admin@cni.tn" 
              required>
          </div>

          <div class="form-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              [(ngModel)]="creds.password" 
              name="password" 
              placeholder="••••••••" 
              required>
          </div>

          <button type="submit" class="btn-login">Se connecter</button>
          
          <div *ngIf="errorMessage" class="error-msg">
            {{ errorMessage }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: #f0f2f5; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .auth-box { 
      background: white; 
      padding: 40px; 
      border-radius: 12px; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.1); 
      width: 100%; 
      max-width: 400px; 
      text-align: center; 
    }
    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      color: #1a237e;
      margin-bottom: 10px;
    }
    h2 { margin-bottom: 5px; color: #1c1e21; }
    p { color: #606770; margin-bottom: 25px; }
    .form-group { margin-bottom: 20px; text-align: left; }
    label { display: block; margin-bottom: 8px; font-weight: 600; color: #4b4f56; }
    input { 
      width: 100%; 
      padding: 12px; 
      border: 1px solid #dddfe2; 
      border-radius: 6px; 
      box-sizing: border-box; 
      font-size: 16px;
    }
    input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
    }
    .btn-login { 
      width: 100%; 
      padding: 12px; 
      background: #1a237e; 
      color: white; 
      border: none; 
      border-radius: 6px; 
      cursor: pointer; 
      font-size: 18px; 
      font-weight: bold;
      transition: background 0.2s;
    }
    .btn-login:hover { background: #0056b3; }
    .error-msg { 
      color: #721c24; 
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 10px;
      border-radius: 4px;
      margin-top: 20px; 
      font-size: 0.9em; 
    }
  `]
})
export class LoginComponent {
  creds = { email: '', password: '' };
  errorMessage = '';

  private auth = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    this.errorMessage = ''; 
    this.auth.login(this.creds).subscribe({
      next: (response: any) => {
        // --- LES AJOUTS SONT ICI ---
        
        // 1. On stocke le TOKEN (clé d'accès à l'API)
        localStorage.setItem('token', response.access_token || response.token);
        
        // 2. On stocke l'objet USER complet (Nom, Email, Rôle)
        // C'est indispensable pour que isAdmin() fonctionne dans le Dashboard
        localStorage.setItem('user', JSON.stringify(response.user));

        // 3. Redirection vers le tableau de bord
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erreur login:', err);
        this.errorMessage = 'Email ou mot de passe incorrect.';
      }
    });
  }
}
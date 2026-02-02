import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <form (ngSubmit)="onRegister()" class="auth-form">
        <h2>🚀 Créer un compte</h2>
        <p class="subtitle">Rejoignez votre équipe de gestion de projet</p>
        
        <div class="input-group">
          <label>Nom complet</label>
          <input type="text" [(ngModel)]="user.nom" name="nom" placeholder="nom" required>
        </div>

        <div class="input-group">
          <label>Email professionnel</label>
          <input type="email" [(ngModel)]="user.email" name="email" placeholder="email@exemple.com" required>
        </div>

        <div class="input-group">
          <label>Mot de passe</label>
          <input type="password" [(ngModel)]="user.password" name="password" placeholder="••••••••" required>
        </div>

        <button type="submit" class="btn-submit">S'inscrire</button>
        
        <div class="footer-link">
          <span>Déjà membre ?</span>
          <a (click)="goToLogin()">Se connecter</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .auth-container { 
      display: flex; justify-content: center; align-items: center; 
      height: 100vh; background: #f0f2f5; font-family: sans-serif;
    }
    .auth-form { 
      background: white; padding: 2.5rem; border-radius: 12px; 
      box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 100%; max-width: 400px; 
    }
    h2 { color: #1a237e; margin-bottom: 0.5rem; text-align: center; }
    .subtitle { color: #666; text-align: center; margin-bottom: 2rem; font-size: 0.9rem; }
    .input-group { margin-bottom: 1.2rem; }
    label { display: block; margin-bottom: 0.5rem; font-weight: bold; font-size: 0.85rem; color: #444; }
    input { 
      width: 100%; padding: 12px; border: 1px solid #ddd; 
      border-radius: 6px; box-sizing: border-box; transition: border 0.3s;
    }
    input:focus { border-color: #3f51b5; outline: none; }
    .btn-submit { 
      width: 100%; background: #1a237e; color: white; padding: 14px; 
      border: none; border-radius: 6px; cursor: pointer; font-weight: bold;
      font-size: 1rem; margin-top: 1rem; transition: background 0.3s;
    }
    .btn-submit:hover { background: #3f51b5; }
    .footer-link { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; }
    a { color: #3f51b5; cursor: pointer; font-weight: bold; margin-left: 5px; }
    a:hover { text-decoration: underline; }
  `]
})
export class RegisterComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Objet envoyé à Laravel
  user = { nom: '', email: '', password: '' };

  onRegister() {
  // 1. Vérification basique
  if (!this.user.nom || !this.user.email || !this.user.password) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  // 2. Préparation des données pour Laravel (Mapping)
  const dataForLaravel = {
    name: this.user.nom,       // On transforme 'nom' en 'name'
    email: this.user.email,
    password: this.user.password,
    password_confirmation: this.user.password // Important si Laravel a la règle 'confirmed'
  };

  // 3. Appel à l'API
  this.http.post('http://127.0.0.1:8000/api/register', dataForLaravel).subscribe({
    next: (res: any) => {
      alert("✅ Compte créé avec succès !");
      this.router.navigate(['/login']);
    },
    error: (err) => {
      console.error("Détails de l'erreur :", err.error);
      
      // On affiche le message précis renvoyé par Laravel s'il existe
      const message = err.error?.message || "L'email est déjà utilisé ou le serveur est injoignable.";
      alert("❌ " + message);
    }
  });
}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
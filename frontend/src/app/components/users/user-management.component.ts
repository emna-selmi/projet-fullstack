import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-header">
      <div class="container flex-header">
        <h1>⚙️ Administration des Utilisateurs</h1>
        <button (click)="goBack()" class="btn-back">⬅️ Retour Dashboard</button>
      </div>
    </div>

    <div class="container main-content">
      <div class="user-card">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">Liste des comptes</h2>
          <button class="btn-add" (click)="showForm = !showForm">
            {{ showForm ? '✖️ Annuler' : '➕ Ajouter Utilisateur' }}
          </button>
        </div>

        <div *ngIf="showForm" class="add-user-form">
          <h3>Créer un nouvel utilisateur</h3>
          <form #userForm="ngForm" (ngSubmit)="userForm.form.valid && submitUser()">
            <div class="form-grid">
              
              <div class="input-group">
                <input type="text" [(ngModel)]="newUser.nom" name="nom" #nom="ngModel" placeholder="Nom complet" required>
                <small class="error" *ngIf="nom.invalid && nom.touched">Le nom est requis</small>
              </div>

              <div class="input-group">
                <input type="email" [(ngModel)]="newUser.email" name="email" #email="ngModel" placeholder="Email (ex: test@cni.tn)" required email>
                <small class="error" *ngIf="email.invalid && email.touched">Format email invalide</small>
              </div>

              <div class="input-group">
                <input type="password" [(ngModel)]="newUser.password" name="password" #pass="ngModel" placeholder="Mot de passe" required minlength="6">
                <small class="error" *ngIf="pass.invalid && pass.touched">6 caractères minimum (Sécurité 7.1)</small>
              </div>

              <select [(ngModel)]="newUser.role" name="role">
                <option value="Utilisateur">Utilisateur</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <button type="submit" class="btn-submit" [disabled]="userForm.form.invalid" [style.opacity]="userForm.form.invalid ? '0.5' : '1'">
              Enregistrer l'utilisateur
            </button>
          </form>
        </div>

        <table *ngIf="users.length > 0; else loading">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle Global</th>
              <th style="text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.nom }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select [(ngModel)]="user.role" (change)="updateUserRole(user)" 
                        class="role-badge-select" 
                        [class.admin-text]="user.role.toLowerCase() === 'admin'">
                  <option value="Utilisateur">Utilisateur</option>
                  <option value="Admin">Admin</option>
                </select>
              </td>
              <td style="text-align: center;">
                <div class="action-buttons">
                  <button (click)="resetPassword(user)" class="btn-reset">🔑 Reset</button>
                  
                  <button 
                    *ngIf="user.email !== 'admin@test.com'" 
                    (click)="deleteUser(user.id_user || user.id)" 
                    class="btn-delete">
                    Supprimer
                  </button>
                  
                  <span *ngIf="user.email === 'admin@test.com'" class="current-label">
                    Compte Actuel
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <ng-template #loading>
          <div class="empty-state">Chargement des utilisateurs ou liste vide...</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1100px; margin: 0 auto; padding: 20px; }
    .admin-header { background: #1a237e; color: white; padding: 20px 0; margin-bottom: 30px; }
    .flex-header { display: flex; justify-content: space-between; align-items: center; }
    .user-card { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 25px; }
    
    .add-user-form { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px dashed #ccc; margin-bottom: 30px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
    .input-group { display: flex; flex-direction: column; }
    .error { color: #dc3545; font-size: 0.75rem; margin-top: 2px; font-weight: 500; }
    input.ng-invalid.ng-touched { border-color: #dc3545; background-color: #fff8f8; }

    input, select { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    .btn-submit { background: #1a237e; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f4f4f4; font-weight: bold; color: #333; }
    
    .role-badge-select { padding: 4px 8px; border-radius: 15px; border: 1px solid #ccc; font-size: 0.85rem; cursor: pointer; }
    .admin-text { background: #fff3cd; color: #856404; font-weight: bold; border-color: #ffeeba; }
    
    .action-buttons { display: flex; gap: 8px; justify-content: center; }
    .btn-reset { background: #ffc107; color: #000; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-delete { background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-add { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn-back { background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    
    .current-label { color: #999; font-size: 0.8em; font-style: italic; align-self: center; }
    .empty-state { text-align: center; padding: 40px; color: #888; }
  `]
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  
  users: any[] = [];
  showForm = false;
  
  newUser = { nom: '', email: '', password: '', role: 'Utilisateur' };

  ngOnInit() { this.loadUsers(); }

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadUsers() {
    this.http.get<any[]>('http://127.0.0.1:8000/api/users', { headers: this.getHeaders() }).subscribe({
      next: (data) => this.users = data,
      error: (err) => console.error("Erreur API :", err)
    });
  }

  submitUser() {
    this.http.post('http://127.0.0.1:8000/api/users', this.newUser, { headers: this.getHeaders() }).subscribe({
      next: () => {
        alert("✅ Utilisateur créé avec succès !");
        this.showForm = false;
        this.newUser = { nom: '', email: '', password: '', role: 'Utilisateur' };
        this.loadUsers();
      },
      error: (err) => alert("❌ Erreur : " + (err.error.errors?.email ? "Cet email est déjà utilisé." : "Impossible de créer l'utilisateur"))
    });
  }

  updateUserRole(user: any) {
    const id = user.id_user || user.id;
    this.http.put(`http://127.0.0.1:8000/api/users/${id}`, { role: user.role }, { headers: this.getHeaders() }).subscribe({
      next: () => console.log("Rôle mis à jour"),
      error: () => alert("Erreur lors de la mise à jour du rôle")
    });
  }

  resetPassword(user: any) {
    const newPass = prompt(`Entrez le nouveau mot de passe pour ${user.nom} (min 6 car.) :`);
    if (!newPass || newPass.length < 6) {
      if(newPass) alert("Sécurité : 6 caractères minimum requis.");
      return;
    }
    const id = user.id_user || user.id;
    this.http.put(`http://127.0.0.1:8000/api/users/${id}`, { password: newPass }, { headers: this.getHeaders() }).subscribe({
      next: () => alert("✅ Mot de passe réinitialisé !"),
      error: () => alert("❌ Erreur de réinitialisation")
    });
  }

  deleteUser(id: number) {
    if (!id || !confirm("🚨 Supprimer définitivement cet utilisateur ?")) return;
    this.http.delete(`http://127.0.0.1:8000/api/users/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => { this.loadUsers(); alert("Utilisateur supprimé."); },
      error: (err) => alert("Erreur de suppression")
    });
  }

  goBack() { window.history.back(); }
}
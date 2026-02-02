import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project';
import { TaskService } from '../../services/task';
import { NotificationService } from '../../services/notification.service';
import { interval, Subscription, forkJoin } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="header-banner">
      <div class="container flex-header">
        <h1>Tableau de Bord - Gestion CNI</h1>
        <div class="header-actions">
          <div class="notif-container">
            <button class="btn-notif" (click)="showMenu = !showMenu">
              🔔 <span class="badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
            </button>
            <div class="notif-dropdown" *ngIf="showMenu">
              <h4>Activités Récentes</h4>
              <div class="notif-list" style="max-height: 350px; overflow-y: auto;">
                <div *ngFor="let n of notifications()" class="notif-item" (click)="notifService.goToNotification(n)"
                     [style.background-color]="n.is_read === 0 ? '#f0f7ff' : 'transparent'"
                     style="padding: 12px; border-bottom: 1px solid #eee; position: relative; cursor: pointer;">
                  <strong style="display: block; font-size: 0.95em; color: #1a237e;">{{ n.title || 'Notification' }}</strong>
                  <p style="margin: 4px 0; font-size: 0.85em; color: #444;">{{ n.message || n.contenu }}</p>
                  <small style="color: #999; font-size: 0.75em;">{{ n.created_at | date:'short' }}</small>
                  <span *ngIf="n.is_read === 0" style="position: absolute; right: 10px; top: 15px; width: 8px; height: 8px; background: #2196f3; border-radius: 50%;"></span>
                </div>
                <div *ngIf="notifications().length === 0" style="padding: 20px; text-align: center; color: #888;">Aucune activité pour le moment.</div>
              </div>
              <button class="btn-all" (click)="goToNotifications()">Voir tout l'historique</button>
            </div>
          </div>
          <button *ngIf="isAdmin()" (click)="goToAdmin()" class="btn-admin">⚙️ Gérer Utilisateurs</button>
          <button (click)="logout()" class="btn-logout">Déconnexion</button>
        </div>
      </div>
    </div>

    <div class="container main-content">
      <div class="dashboard-stats">
        <h3>📊 Statistiques Globales <small style="font-size: 0.5em; color: #4caf50;">● Temps Réel</small></h3>
        <div class="global-stats-grid">
          <div class="stat-card blue"><h3>{{ projectService.projects().length }}</h3><p>Total Projets</p></div>
          <div class="stat-card green"><h3>{{ completedProjectsCount() }}</h3><p>Terminés</p></div>
          <div class="stat-card orange"><h3>{{ globalProgress() }}%</h3><p>Avancement Global</p></div>
        </div>
      </div>

      <div class="creation-box">
        <h3>+ Nouveau Projet</h3>
        <form #pForm="ngForm" (ngSubmit)="pForm.form.valid && createProject()" class="inline-form">
          <input type="text" [(ngModel)]="newProject.nom_projet" name="nom" placeholder="Nom du projet" required>
          <input type="text" [(ngModel)]="newProject.description" name="desc" placeholder="Description">
          <input type="date" [(ngModel)]="newProject.date_fin" name="date" required>
          <button type="submit" [disabled]="pForm.form.invalid" class="btn-primary">Enregistrer</button>
        </form>
      </div>

      <div class="filters-bar">
        <input type="text" [(ngModel)]="searchQuery" placeholder="🔍 Rechercher un projet...">
      </div>

      <div class="grid" *ngIf="filteredProjects().length > 0; else noProjects">
        <div *ngFor="let p of filteredProjects()" class="card">
          <div class="card-header">
            <h3 (click)="goToProject(p.id_project || p.id)" class="project-link">{{ p.nom_projet || p.nom }}</h3>
          </div>
          <div class="project-progress-mini">
            <div class="progress-bar-bg"><div class="progress-bar-fill" [style.width.%]="p.completion_rate || 0"></div></div>
            <small>{{ p.completion_rate || 0 }}% terminé</small>
          </div>
          <div class="card-footer">
            <small>Échéance : {{ p.date_fin }}</small>
            <button *ngIf="canUserDelete(p)" (click)="deleteProject(p.id_project || p.id)" class="btn-del" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">
              🗑️
            </button>
          </div>
        </div>
      </div>
      <ng-template #noProjects><div class="empty">Aucun projet trouvé.</div></ng-template>
    </div>

    <div class="toast-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
      <div *ngFor="let toast of notifService.toasts()" class="toast" [ngClass]="toast.type"
           style="padding: 15px; margin-bottom: 5px; border-radius: 8px; color: white; background: #333;">
        {{ toast.msg }}
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
    .header-banner { background: #1a237e; color: white; padding: 15px 0; }
    .flex-header { display: flex; justify-content: space-between; align-items: center; }
    .header-actions { display: flex; align-items: center; gap: 20px; }
    .notif-container { position: relative; }
    .btn-notif { background: none; border: none; font-size: 1.5rem; cursor: pointer; position: relative; }
    .badge { position: absolute; top: 0; right: 0; background: #ff5252; color: white; font-size: 0.7rem; padding: 2px 5px; border-radius: 50%; }
    .notif-dropdown { position: absolute; right: 0; top: 40px; background: white; color: #333; width: 280px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 1000; padding: 10px; }
    .global-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { padding: 15px; border-radius: 10px; color: white; text-align: center; }
    .blue { background: #3f51b5; } .green { background: #43a047; } .orange { background: #fb8c00; }
    .progress-bar-bg { background: #e0e0e0; height: 6px; border-radius: 3px; overflow: hidden; }
    .progress-bar-fill { background: #4caf50; height: 100%; transition: width 0.5s; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .card { background: white; border: 1px solid #eee; padding: 20px; border-radius: 12px; }
    .project-link { cursor: pointer; color: #1976d2; font-weight: bold; }
    .btn-primary { background: #2e7d32; color: white; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; }
    .creation-box { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 25px 0; }
    .inline-form { display: flex; gap: 10px; }
    .toast.success { background: #43a047; } .toast.error { background: #d32f2f; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  public projectService = inject(ProjectService);
  public taskService = inject(TaskService);
  public notifService = inject(NotificationService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private refreshSubscription?: Subscription;

  newProject = { nom_projet: '', description: '', date_fin: '' };
  searchQuery: string = '';
  showMenu = false;
  notifications = signal<any[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => n.is_read === 0 || n.is_read === false).length);
  completedProjectsCount = computed(() => this.projectService.projects().filter(p => Number(p.completion_rate) === 100).length);
  globalProgress = computed(() => {
    const projects = this.projectService.projects();
    if (!projects.length) return 0;
    const total = projects.reduce((acc, p) => acc + (Number(p.completion_rate) || 0), 0);
    return Math.round(total / projects.length);
  });

  ngOnInit() {
    this.loadProjectsAndTasks();
    this.loadNotifs();
    this.refreshSubscription = interval(5000).subscribe(() => this.loadNotifs());
  }

  ngOnDestroy() { if (this.refreshSubscription) this.refreshSubscription.unsubscribe(); }

  isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role?.toLowerCase() === 'admin' || Number(user.is_admin) === 1;
  }

  canUserDelete(p: any): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = Number(user.id_user || user.id);
    const creatorId = Number(p.id_user_createur || p.user_id);
    return this.isAdmin() || (currentUserId > 0 && currentUserId === creatorId);
  }

  // Dans dashboard.component.ts
loadNotifs() {
  // On arrête d'essayer d'appeler /api/admin/notifications-all
  // On utilise uniquement le service de base qui, lui, fonctionne
  this.notifService.getNotifications().subscribe({
    next: (data) => {
      this.notifications.set(data);
    },
    error: (err) => {
      // Si même cette route échoue, on affiche une erreur propre
      console.warn("Les notifications ne sont pas accessibles pour le moment.");
    }
  });
}

  loadProjectsAndTasks() {
    this.projectService.getProjects().subscribe(projects => {
      if (!projects || projects.length === 0) {
        this.projectService.projects.set([]);
        return;
      }
      const taskRequests = projects.map(p => this.taskService.getByProject(p.id_project || p.id));
      forkJoin(taskRequests).subscribe(allTasks => {
        projects.forEach((p, index) => p.tasks = allTasks[index]);
        this.projectService.projects.set(projects);
      });
    });
  }

  createProject() {
    this.projectService.createProject(this.newProject).subscribe({
      next: () => {
        this.newProject = { nom_projet: '', description: '', date_fin: '' };
        this.loadProjectsAndTasks();
        this.notifService.show("✅ Projet créé !");
      },
      error: (err) => console.error("Détails erreur :", err.error?.message)
    });
  }

  deleteProject(id: any) {
    if (confirm("Supprimer définitivement ce projet ?")) {
      (this.projectService as any).deleteProject(id).subscribe(() => {
        this.notifService.show("🗑️ Projet supprimé");
        this.loadProjectsAndTasks();
      });
    }
  }

  filteredProjects() {
    return this.projectService.projects().filter(p => (p.nom_projet || '').toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  goToProject(id: number) { this.router.navigate(['/project', id]); }
  goToAdmin() { this.router.navigate(['/admin/users']); }
  goToNotifications() { this.router.navigate(['/notifications']); }
  logout() { localStorage.clear(); window.location.href = '/login'; }
}
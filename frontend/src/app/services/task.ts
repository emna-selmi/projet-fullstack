import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs'; 

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  
  updateStatus(taskId: number, newStatus: string) {
  return this.http.put(`http://127.0.0.1:8000/api/tasks/${taskId}/status`, { 
    etat: newStatus 
  }, { headers: this.getHeaders() });
}

  getByProject(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/projects/${id}/tasks`, { headers: this.getHeaders() });
  }

  getTasksByProject(id: number) {
    return this.getByProject(id);
  }

  createTask(task: any) {
    return this.http.post(`${this.apiUrl}/tasks`, task, { headers: this.getHeaders() });
  }

  assignTask(taskId: number, userId: number) {
    return this.http.put(`${this.apiUrl}/tasks/${taskId}/assign`, 
      { id_user: userId }, 
      { headers: this.getHeaders() }
    );
  }

  
  getNotifications(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/notifications`, { headers: this.getHeaders() }).pipe(
      map(response => {
        
        return Array.isArray(response) ? response : (response.data || []);
      })
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationRecord {
  id: number;
  user_id: number;
  vendor_id: number | null;
  notification_type: string;
  title: string;
  message: string;
  channel: string;
  delivery_status: string;
  is_read: boolean;
  source_type: string | null;
  source_id: number | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  procurement_alerts: number;
  delivery_delays: number;
  vendor_approvals: number;
  contract_expiry_alerts: number;
  compliance_alerts: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<NotificationRecord[]> {
    return this.http.get<NotificationRecord[]>(this.apiUrl);
  }

  getSummary(): Observable<NotificationSummary> {
    return this.http.get<NotificationSummary>(
      `${this.apiUrl}/summary`
    );
  }

  syncNotifications(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/sync`,
      {}
    );
  }

  markAsRead(id: number): Observable<NotificationRecord> {
    return this.http.patch<NotificationRecord>(
      `${this.apiUrl}/${id}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/read-all`,
      {}
    );
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${id}`
    );
  }
}
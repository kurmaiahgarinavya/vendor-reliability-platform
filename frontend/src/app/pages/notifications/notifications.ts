import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  NotificationRecord,
  NotificationService,
  NotificationSummary
} from '../../core/services/notification';


@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss'
})
export class Notifications implements OnInit {

  notifications: NotificationRecord[] = [];

  summary: NotificationSummary = {
    total: 0,
    unread: 0,
    procurement_alerts: 0,
    delivery_delays: 0,
    vendor_approvals: 0,
    contract_expiry_alerts: 0,
    compliance_alerts: 0
  };

  loading = true;
  syncing = false;
  errorMessage = '';

  filter = 'ALL';

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {

    this.loading = true;
    this.errorMessage = '';

    this.notificationService.syncNotifications().subscribe({
      next: () => {
        this.loadData();
      },
      error: () => {
        this.loadData();
      }
    });
  }

  loadData(): void {

    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {

        this.notifications = notifications;

        this.notificationService.getSummary().subscribe({
          next: (summary) => {
            this.summary = summary;
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.loading = false;
            this.cdr.detectChanges();
          }
        });

      },
      error: (error) => {

        console.error(
          'Failed to load notifications:',
          error
        );

        this.errorMessage =
          'Unable to load notifications.';

        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }

  refresh(): void {

    this.syncing = true;

    this.notificationService.syncNotifications().subscribe({
      next: () => {
        this.syncing = false;
        this.loadData();
      },
      error: () => {
        this.syncing = false;
        this.loadData();
      }
    });
  }

  setFilter(filter: string): void {
    this.filter = filter;
  }

  get filteredNotifications(): NotificationRecord[] {

    if (this.filter === 'ALL') {
      return this.notifications;
    }

    if (this.filter === 'UNREAD') {
      return this.notifications.filter(
        notification => !notification.is_read
      );
    }

    return this.notifications.filter(
      notification =>
        notification.notification_type === this.filter
    );
  }

  markAsRead(notification: NotificationRecord): void {

    if (notification.is_read) {
      return;
    }

    this.notificationService
      .markAsRead(notification.id)
      .subscribe({
        next: (updated) => {

          const index = this.notifications.findIndex(
            item => item.id === updated.id
          );

          if (index !== -1) {
            this.notifications[index] = updated;
          }

          this.loadSummaryOnly();
        },
        error: (error) => {
          console.error(
            'Failed to mark notification as read:',
            error
          );
        }
      });
  }

  markAllAsRead(): void {

    this.notificationService
      .markAllAsRead()
      .subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error(
            'Failed to mark all notifications as read:',
            error
          );
        }
      });
  }

  deleteNotification(
    notification: NotificationRecord
  ): void {

    this.notificationService
      .deleteNotification(notification.id)
      .subscribe({
        next: () => {

          this.notifications =
            this.notifications.filter(
              item => item.id !== notification.id
            );

          this.loadSummaryOnly();
        },
        error: (error) => {
          console.error(
            'Failed to delete notification:',
            error
          );
        }
      });
  }

  loadSummaryOnly(): void {

    this.notificationService
      .getSummary()
      .subscribe({
        next: (summary) => {
          this.summary = summary;
          this.cdr.detectChanges();
        }
      });
  }

  getNotificationIcon(type: string): string {

    switch (type) {

      case 'PROCUREMENT_ALERT':
        return '📦';

      case 'DELIVERY_DELAY':
        return '🚚';

      case 'VENDOR_APPROVAL':
        return '👤';

      case 'CONTRACT_EXPIRY':
        return '📄';

      case 'COMPLIANCE':
        return '⚠️';

      default:
        return '🔔';
    }
  }

  getNotificationLabel(type: string): string {

    switch (type) {

      case 'PROCUREMENT_ALERT':
        return 'Procurement';

      case 'DELIVERY_DELAY':
        return 'Delivery Delay';

      case 'VENDOR_APPROVAL':
        return 'Vendor Approval';

      case 'CONTRACT_EXPIRY':
        return 'Contract Expiry';

      case 'COMPLIANCE':
        return 'Compliance';

      default:
        return 'Notification';
    }
  }

  formatDate(value: string): string {

    if (!value) {
      return '';
    }

    return new Date(value).toLocaleString();
  }
}
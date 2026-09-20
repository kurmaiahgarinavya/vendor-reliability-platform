import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import {
  AnalyticsService,
  DashboardAnalytics
} from '../../core/services/analytics';

type ReliabilityFactor =
  | 'Delivery'
  | 'Quality'
  | 'Communication'
  | 'Compliance';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  analytics: DashboardAnalytics | null = null;

  loading = true;
  errorMessage = '';

  readonly reliabilityFactors: {
    name: string;
    key: ReliabilityFactor;
  }[] = [
    { name: 'Delivery', key: 'Delivery' },
    { name: 'Quality', key: 'Quality' },
    { name: 'Communication', key: 'Communication' },
    { name: 'Compliance', key: 'Compliance' }
  ];

  constructor(
    public authService: AuthService,
    private analyticsService: AnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.analyticsService.getDashboardAnalytics().subscribe({
      next: (data: DashboardAnalytics) => {
        console.log('DASHBOARD API RESPONSE:', data);

        this.analytics = data;
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error: unknown) => {
        console.error('DASHBOARD API ERROR:', error);

        this.loading = false;

        const apiError = error as {
          error?: {
            detail?: string;
          };
        };

        this.errorMessage =
          apiError?.error?.detail ||
          'Unable to load dashboard analytics.';

        this.cdr.detectChanges();
      }
    });
  }

  refresh(): void {
    this.loadDashboard();
  }

  getFactorValue(
    key: ReliabilityFactor
  ): number | null {

    if (!this.analytics) {
      return null;
    }

    return this.analytics
      .vendor_performance
      .reliability_factors[key];
  }

  percentage(
    value: number | null | undefined
  ): string {

    if (value === null || value === undefined) {
      return '—';
    }

    return `${Number(value).toFixed(0)}%`;
  }

  value(
    value: number | null | undefined
  ): string {

    if (value === null || value === undefined) {
      return '—';
    }

    return Number(value).toFixed(1);
  }

  factorValue(
    value: number | null | undefined
  ): number {

    if (value === null || value === undefined) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(100, Number(value))
    );
  }

  hasVendorPerformanceData(): boolean {
    if (!this.analytics) {
      return false;
    }

    return (
      this.analytics.vendor_performance.performance_score !== null ||
      this.analytics.vendor_performance.delivery_rate !== null ||
      this.analytics.vendor_performance.quality_rating !== null ||
      this.analytics.vendor_performance.response_time_hours !== null
    );
  }

  hasReliabilityData(): boolean {
    if (!this.analytics) {
      return false;
    }

    return (
      this.analytics.vendor_performance.reliability_score !== null
    );
  }

  getRoleLabel(): string {
    return (
      this.authService.currentUser()?.role ||
      'User'
    );
  }

  getUserName(): string {
    return (
      this.authService.currentUser()?.full_name ||
      'User'
    );
  }
}
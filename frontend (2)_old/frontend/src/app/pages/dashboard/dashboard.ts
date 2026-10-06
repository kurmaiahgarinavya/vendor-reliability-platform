
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

type UserRole =
  | 'Administrator'
  | 'Procurement Manager'
  | 'Supply Chain Manager'
  | 'Vendor'
  | 'Finance Officer'
  | 'Auditor';

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
        this.analytics = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        console.error('Dashboard API error:', error);

        this.loading = false;

        const apiError = error as {
          error?: {
            detail?: string;
          };
        };

        this.errorMessage =
          apiError?.error?.detail ||
          'Unable to load dashboard analytics. Please try again.';

        this.cdr.detectChanges();
      }
    });
  }

  refresh(): void {
    this.loadDashboard();
  }

  getRoleLabel(): string {
    return this.authService.currentUser()?.role || 'User';
  }

  getUserName(): string {
    return this.authService.currentUser()?.full_name || 'User';
  }

  getDashboardTitle(): string {
    const role = this.getRoleLabel();

    const titles: Record<string, string> = {
      'Administrator': 'System Overview',
      'Procurement Manager': 'Procurement Overview',
      'Supply Chain Manager': 'Supply Chain Overview',
      'Vendor': 'Vendor Overview',
      'Finance Officer': 'Financial Overview',
      'Auditor': 'Compliance Overview'
    };

    return titles[role] || 'Dashboard Overview';
  }

  getDashboardDescription(): string {
    const role = this.getRoleLabel();

    const descriptions: Record<string, string> = {
      'Administrator':
        'Monitor users, vendors, procurement activity and platform operations.',
      'Procurement Manager':
        'Track procurement requests, purchase orders, vendors and contracts.',
      'Supply Chain Manager':
        'Monitor supplier reliability, delivery performance and procurement progress.',
      'Vendor':
        'Review your vendor performance, reliability information and business activity.',
      'Finance Officer':
        'Review procurement values, purchase orders and financial reporting.',
      'Auditor':
        'Review vendor reliability, contracts, compliance and audit information.'
    };

    return descriptions[role] ||
      'Vendor reliability and procurement intelligence dashboard.';
  }

  isAdministrator(): boolean {
    return this.getRoleLabel() === 'Administrator';
  }

  isProcurementRole(): boolean {
    return [
      'Administrator',
      'Procurement Manager',
      'Supply Chain Manager'
    ].includes(this.getRoleLabel());
  }

  isFinanceRole(): boolean {
    return [
      'Administrator',
      'Finance Officer'
    ].includes(this.getRoleLabel());
  }

  canViewVendorIntelligence(): boolean {
    return [
      'Administrator',
      'Procurement Manager',
      'Supply Chain Manager',
      'Vendor',
      'Auditor'
    ].includes(this.getRoleLabel());
  }

  canViewCompliance(): boolean {
    return [
      'Administrator',
      'Procurement Manager',
      'Supply Chain Manager',
      'Vendor',
      'Auditor'
    ].includes(this.getRoleLabel());
  }

  canViewCommunication(): boolean {
    return [
      'Administrator',
      'Procurement Manager',
      'Supply Chain Manager',
      'Vendor'
    ].includes(this.getRoleLabel());
  }

  canViewFinancialSummary(): boolean {
    return this.isFinanceRole() ||
      this.isProcurementRole();
  }

  getFactorValue(
    key: ReliabilityFactor
  ): number | null {
    if (!this.analytics) {
      return null;
    }

    return this.analytics.vendor_performance
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

    const performance = this.analytics.vendor_performance;

    return (
      performance.performance_score !== null ||
      performance.delivery_rate !== null ||
      performance.quality_rating !== null ||
      performance.response_time_hours !== null
    );
  }

  hasReliabilityData(): boolean {
    return (
      this.analytics?.vendor_performance.reliability_score !== null &&
      this.analytics?.vendor_performance.reliability_score !== undefined
    );
  }
}
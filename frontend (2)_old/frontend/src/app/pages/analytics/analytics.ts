import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  AnalyticsService,
  DashboardAnalytics
} from '../../core/services/analytics';

import {
  DatasetAnalyticsService,
  DatasetAnalytics
} from '../../core/services/dataset-analytics';


type ReliabilityFactor =
  | 'Delivery'
  | 'Quality'
  | 'Communication'
  | 'Compliance';


@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class Analytics implements OnInit {

  analytics: DashboardAnalytics | null = null;

  datasetAnalytics: DatasetAnalytics | null = null;

  loading = true;
  datasetLoading = true;

  errorMessage = '';
  datasetErrorMessage = '';

  readonly reliabilityFactors: {
    name: string;
    key: ReliabilityFactor;
  }[] = [
    {
      name: 'Delivery History',
      key: 'Delivery'
    },
    {
      name: 'Product Quality',
      key: 'Quality'
    },
    {
      name: 'Communication Efficiency',
      key: 'Communication'
    },
    {
      name: 'Contract Compliance',
      key: 'Compliance'
    }
  ];


  constructor(
    private analyticsService: AnalyticsService,
    private datasetAnalyticsService: DatasetAnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.loadAnalytics();
    this.loadDatasetAnalytics();
  }


  loadAnalytics(): void {

    this.loading = true;
    this.errorMessage = '';

    this.analyticsService
      .getDashboardAnalytics()
      .subscribe({

        next: (data) => {

          this.analytics = data;

          console.log(
            'VendorIQ database analytics:',
            data
          );

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Analytics loading failed:',
            error
          );

          this.errorMessage =
            'Unable to load analytics data.';

          this.loading = false;

          this.cdr.detectChanges();
        }

      });
  }


  loadDatasetAnalytics(): void {

    this.datasetLoading = true;
    this.datasetErrorMessage = '';

    this.datasetAnalyticsService
      .getDatasetAnalytics()
      .subscribe({

        next: (data) => {

          this.datasetAnalytics = data;

          console.log(
            'DataCo dataset analytics:',
            data
          );

          this.datasetLoading = false;

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Dataset analytics loading failed:',
            error
          );

          this.datasetErrorMessage =
            'Unable to load the supply-chain dataset analytics.';

          this.datasetLoading = false;

          this.cdr.detectChanges();
        }

      });
  }


  refresh(): void {

    this.loadAnalytics();
    this.loadDatasetAnalytics();
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


  formatNumber(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return Number(value).toFixed(2);
  }


  integer(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return Number(value).toLocaleString(
      'en-IN'
    );
  }


  percentage(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return `${Number(value).toFixed(1)}%`;
  }


  currency(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '₹0.00';
    }

    return `₹${Number(value).toLocaleString(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;
  }


  factorWidth(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '0%';
    }

    return `${Math.max(
      0,
      Math.min(
        100,
        Number(value)
      )
    )}%`;
  }


  datasetStatusWidth(
    value: number
  ): string {

    if (
      !this.datasetAnalytics ||
      this.datasetAnalytics.total_records === 0
    ) {
      return '0%';
    }

    return `${(
      value /
      this.datasetAnalytics.total_records *
      100
    ).toFixed(2)}%`;
  }


  latestMonthlyTrend(): DatasetAnalytics['monthly_trend'] {

    if (!this.datasetAnalytics) {
      return [];
    }

    return this.datasetAnalytics.monthly_trend.slice(-12);
  }


  monthlyWidth(
    value: number
  ): string {

    if (!this.datasetAnalytics) {
      return '0%';
    }

    const maximum = Math.max(
      ...this.latestMonthlyTrend()
        .map(item => item.total_records),
      1
    );

    return `${(
      value /
      maximum *
      100
    ).toFixed(2)}%`;
  }
}
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule,
  DatePipe
} from '@angular/common';

import {
  ReliabilityFactor,
  VendorReliabilitySummary,
  ReliabilityService
} from '../../core/services/reliability';

@Component({
  selector: 'app-reliability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reliability.html',
  styleUrl: './reliability.scss'
})
export class Reliability implements OnInit {

  vendors: VendorReliabilitySummary[] = [];

  selectedVendor: VendorReliabilitySummary | null = null;

  loading = true;

  errorMessage = '';

  constructor(
    private reliabilityService: ReliabilityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReliability();
  }

  loadReliability(): void {

    this.loading = true;

    this.errorMessage = '';

    this.reliabilityService
      .getReliability()
      .subscribe({

        next: (
          data: VendorReliabilitySummary[]
        ) => {

          console.log(
            'RELIABILITY: API response',
            data
          );

          this.vendors = data || [];

          this.loading = false;

          if (this.vendors.length > 0) {

            this.selectedVendor =
              this.vendors[0];

          } else {

            this.selectedVendor = null;
          }

          this.cdr.detectChanges();
        },

        error: (error: unknown) => {

          console.error(
            'RELIABILITY: API error',
            error
          );

          this.loading = false;

          this.vendors = [];

          this.selectedVendor = null;

          const apiError = error as {
            error?: {
              detail?: string;
            };
          };

          this.errorMessage =
            apiError?.error?.detail ||
            'Unable to load vendor reliability data.';

          this.cdr.detectChanges();
        }
      });
  }

  selectVendor(
    vendor: VendorReliabilitySummary
  ): void {

    this.selectedVendor = vendor;
  }

  refresh(): void {

    this.loadReliability();
  }

  getRiskClass(
    risk: string
  ): string {

    switch (
      risk?.toLowerCase()
    ) {

      case 'low risk':
        return 'low-risk';

      case 'medium risk':
        return 'medium-risk';

      case 'high risk':
        return 'high-risk';

      default:
        return '';
    }
  }

  getScoreClass(
    score: number
  ): string {

    const value = Number(score);

    if (value >= 75) {
      return 'strong';
    }

    if (value >= 50) {
      return 'moderate';
    }

    return 'weak';
  }

  formatScore(
    score: number | null
  ): string {

    if (
      score === null ||
      score === undefined
    ) {
      return '—';
    }

    return Number(score).toFixed(0);
  }

  getFactor(
    name: string
  ): ReliabilityFactor | undefined {

    return this.selectedVendor?.factors.find(
      factor => factor.name === name
    );
  }

  getFactorScore(
    name: string
  ): number | null {

    return this.getFactor(name)?.score ?? null;
  }

  getFactorWidth(
    name: string
  ): number {

    const score = this.getFactorScore(name);

    return score === null
      ? 0
      : Number(score);
  }

  getTrendWidth(
    score: number
  ): number {

    return Math.max(
      0,
      Math.min(
        100,
        Number(score)
      )
    );
  }
}
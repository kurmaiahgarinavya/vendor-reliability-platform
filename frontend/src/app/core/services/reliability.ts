import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ReliabilityFactor {
  name: string;
  score: number | null;
  description: string;
  status: string;
}

export interface ReliabilityTrend {
  evaluation_date: string;
  performance_score: number;
  reliability_score: number;
}

export interface VendorReliabilitySummary {
  vendor_id: number;
  vendor_name: string;
  category: string;
  vendor_status: string;

  reliability_score: number;
  supplier_ranking: number;
  procurement_risk_level: string;

  factors: ReliabilityFactor[];

  trend: ReliabilityTrend[];

  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReliabilityService {

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/vendor-reliability';

  constructor(
    private http: HttpClient
  ) {}

  getReliability(): Observable<VendorReliabilitySummary[]> {

    return this.http
      .get<VendorReliabilitySummary[]>(
        this.apiUrl
      )
      .pipe(
        map((vendors) =>
          vendors.map((vendor) => ({
            ...vendor,

            reliability_score:
              Number(vendor.reliability_score),

            supplier_ranking:
              Number(vendor.supplier_ranking),

            factors:
              vendor.factors.map((factor) => ({
                ...factor,

                score:
                  factor.score === null
                    ? null
                    : Number(factor.score)
              })),

            trend:
              vendor.trend.map((item) => ({
                ...item,

                performance_score:
                  Number(item.performance_score),

                reliability_score:
                  Number(item.reliability_score)
              }))
          }))
        )
      );
  }

  getVendorReliability(
    vendorId: number
  ): Observable<VendorReliabilitySummary> {

    return this.http
      .get<VendorReliabilitySummary>(
        `${this.apiUrl}/${vendorId}`
      )
      .pipe(
        map((vendor) => ({
          ...vendor,

          reliability_score:
            Number(vendor.reliability_score),

          supplier_ranking:
            Number(vendor.supplier_ranking),

          factors:
            vendor.factors.map((factor) => ({
              ...factor,

              score:
                factor.score === null
                  ? null
                  : Number(factor.score)
            })),

          trend:
            vendor.trend.map((item) => ({
              ...item,

              performance_score:
                Number(item.performance_score),

              reliability_score:
                Number(item.reliability_score)
            }))
        }))
      );
  }
}
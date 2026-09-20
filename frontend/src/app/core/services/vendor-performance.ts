import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';


export interface VendorPerformanceSummary {

  vendor_id: number;

  vendor_name: string;

  category: string;

  vendor_status: string;

  total_orders: number;

  on_time_deliveries: number;

  delayed_deliveries: number;

  quality_rating: number | null;

  service_rating: number | null;

  response_time_hours: number | null;

  issue_resolution_time_hours: number | null;

  order_completion_rate: number | null;

  performance_score: number | null;

  ranking: number | null;

  performance_status: string;

}


export interface VendorPerformanceHistory {

  id: number;

  vendor_id: number;

  vendor_name: string;

  purchase_order_id: number | null;

  purchase_order_number: string | null;

  expected_delivery_date: string | null;

  actual_delivery_date: string | null;

  delivery_status: string;

  quality_rating: number | null;

  service_rating: number | null;

  response_time_hours: number | null;

  issue_resolution_time_hours: number | null;

  issue_count: number;

  notes: string | null;

  evaluation_date: string;

}


export interface VendorPerformanceCreate {

  vendor_id: number;

  purchase_order_id: number | null;

  actual_delivery_date: string | null;

  quality_rating: number | null;

  service_rating: number | null;

  response_time_hours: number | null;

  issue_resolution_time_hours: number | null;

  issue_count: number;

  notes: string | null;

  evaluation_date: string;

}


@Injectable({
  providedIn: 'root'
})
export class VendorPerformanceService {

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/vendor-performance';


  constructor(
    private http: HttpClient
  ) {}


  getPerformance():
    Observable<VendorPerformanceSummary[]> {

    return this.http
      .get<VendorPerformanceSummary[]>(
        this.apiUrl
      )
      .pipe(

        map((vendors) =>

          vendors.map((vendor) => ({

            ...vendor,

            total_orders:
              Number(vendor.total_orders),

            on_time_deliveries:
              Number(vendor.on_time_deliveries),

            delayed_deliveries:
              Number(vendor.delayed_deliveries),


            quality_rating:
              vendor.quality_rating === null ||
              vendor.quality_rating === undefined
                ? null
                : Number(
                    vendor.quality_rating
                  ),


            service_rating:
              vendor.service_rating === null ||
              vendor.service_rating === undefined
                ? null
                : Number(
                    vendor.service_rating
                  ),


            response_time_hours:
              vendor.response_time_hours === null ||
              vendor.response_time_hours === undefined
                ? null
                : Number(
                    vendor.response_time_hours
                  ),


            issue_resolution_time_hours:
              vendor.issue_resolution_time_hours === null ||
              vendor.issue_resolution_time_hours === undefined
                ? null
                : Number(
                    vendor.issue_resolution_time_hours
                  ),


            order_completion_rate:
              vendor.order_completion_rate === null ||
              vendor.order_completion_rate === undefined
                ? null
                : Number(
                    vendor.order_completion_rate
                  ),


            performance_score:
              vendor.performance_score === null ||
              vendor.performance_score === undefined
                ? null
                : Number(
                    vendor.performance_score
                  ),


            ranking:
              vendor.ranking === null ||
              vendor.ranking === undefined
                ? null
                : Number(
                    vendor.ranking
                  )

          }))

        )

      );

  }


  getPerformanceSummaries():
    Observable<VendorPerformanceSummary[]> {

    return this.getPerformance();

  }


  getHistory(
    vendorId: number
  ): Observable<VendorPerformanceHistory[]> {

    return this.http

      .get<VendorPerformanceHistory[]>(
        `${this.apiUrl}/${vendorId}/history`
      )

      .pipe(

        map((history) =>

          history.map((item) => ({

            ...item,

            purchase_order_id:
              item.purchase_order_id === null ||
              item.purchase_order_id === undefined
                ? null
                : Number(
                    item.purchase_order_id
                  ),


            quality_rating:
              item.quality_rating === null ||
              item.quality_rating === undefined
                ? null
                : Number(
                    item.quality_rating
                  ),


            service_rating:
              item.service_rating === null ||
              item.service_rating === undefined
                ? null
                : Number(
                    item.service_rating
                  ),


            response_time_hours:
              item.response_time_hours === null ||
              item.response_time_hours === undefined
                ? null
                : Number(
                    item.response_time_hours
                  ),


            issue_resolution_time_hours:
              item.issue_resolution_time_hours === null ||
              item.issue_resolution_time_hours === undefined
                ? null
                : Number(
                    item.issue_resolution_time_hours
                  ),


            issue_count:
              Number(
                item.issue_count
              )

          }))

        )

      );

  }


  getVendorHistory(
    vendorId: number
  ): Observable<VendorPerformanceHistory[]> {

    return this.getHistory(
      vendorId
    );

  }


  createEvaluation(
    data: VendorPerformanceCreate
  ): Observable<VendorPerformanceHistory> {

    return this.http.post<VendorPerformanceHistory>(
      this.apiUrl,
      data
    );

  }


  deleteEvaluation(
    evaluationId: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/evaluations/${evaluationId}`
    );

  }

}
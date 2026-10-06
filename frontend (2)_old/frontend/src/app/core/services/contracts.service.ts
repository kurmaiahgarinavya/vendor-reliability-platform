import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Contract {
  id: number;
  contract_number: string;
  title: string;
  contract_type: string;
  vendor_id: number;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  contract_value: number | null;
  payment_terms: string | null;
  notes: string | null;
  status: string;
  compliance_status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/contracts';

  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      this.apiUrl
    );
  }

  getExpiringContracts(
    days: number = 30
  ): Observable<Contract[]> {
    return this.http.get<Contract[]>(
      `${this.apiUrl}/expiring?days=${days}`
    );
  }

  getContract(
    contractId: number
  ): Observable<Contract> {
    return this.http.get<Contract>(
      `${this.apiUrl}/${contractId}`
    );
  }
}
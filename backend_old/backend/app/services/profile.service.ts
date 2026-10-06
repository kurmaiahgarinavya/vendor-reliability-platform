import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VendorProfile {
  id: number;
  name: string;
  category: string | null;
  contact_person: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  contract_details: string | null;
}

export interface VendorProfileUpdate {
  name?: string;
  category?: string;
  contact_person?: string;
  phone?: string;
  location?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private http = inject(HttpClient);

  private readonly apiUrl =
    'http://127.0.0.1:8000/api/profile';

  getMyProfile(): Observable<VendorProfile> {
    return this.http.get<VendorProfile>(
      `${this.apiUrl}/me`
    );
  }

  updateMyProfile(
    profile: VendorProfileUpdate
  ): Observable<VendorProfile> {
    return this.http.put<VendorProfile>(
      `${this.apiUrl}/me`,
      profile
    );
  }
}
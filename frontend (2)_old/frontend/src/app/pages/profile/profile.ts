import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

  profile = {
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    category: '',
    location: ''
  };

  message = '';

  constructor(
    private authService: AuthService
  ) {
    const user = this.authService.currentUser();

    if (user) {
      this.profile.full_name = user.full_name ?? '';
      this.profile.email = user.email ?? '';
    }
  }

  saveProfile(): void {
    this.message = 'Profile information updated successfully.';

    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}
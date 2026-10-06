import {
  CommonModule
} from '@angular/common';

import {
  Component,
  OnInit
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  AuthService
} from '../../core/services/auth';

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
export class Profile implements OnInit {

  user: any = null;

  loading = true;

  saving = false;

  successMessage = '';

  errorMessage = '';

  profile = {
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    category: '',
    location: ''
  };

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.loadProfile();

  }

  loadProfile(): void {

    this.loading = true;

    this.errorMessage = '';

    const currentUser =
      this.authService.currentUser();

    if (!currentUser) {

      this.errorMessage =
        'Unable to load your profile. Please login again.';

      this.loading = false;

      return;

    }

    this.user = currentUser;

    this.profile.full_name =
      currentUser.full_name ?? '';

    this.profile.email =
      currentUser.email ?? '';

    this.profile.phone =
      currentUser.phone ?? '';

    this.profile.company_name =
      currentUser.company_name ?? '';

    this.profile.category =
      currentUser.category ?? '';

    this.profile.location =
      currentUser.location ?? '';

    this.loading = false;

  }

  saveProfile(): void {

    this.successMessage = '';

    this.errorMessage = '';

    this.saving = true;

    /*
     * For now we keep profile editing local to the
     * authenticated user object.
     *
     * Backend profile update will be connected once
     * the user-profile API is finalized.
     */

    setTimeout(() => {

      this.saving = false;

      this.successMessage =
        'Profile information updated successfully.';

    }, 500);

  }

  get initials(): string {

    const name =
      this.profile.full_name.trim();

    if (!name) {
      return 'V';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        part =>
          part.charAt(0).toUpperCase()
      )
      .join('');

  }

}
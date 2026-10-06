import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import {
  Vendor,
  VendorCreate,
  VendorUpdate,
  VendorService,
  VENDOR_CATEGORIES,
  VENDOR_STATUSES
} from '../../core/services/vendor';


interface VendorForm {

  name: FormControl<string>;

  category: FormControl<string>;

  contact_person: FormControl<string>;

  email: FormControl<string>;

  phone: FormControl<string>;

  location: FormControl<string>;

  contract_details: FormControl<string>;
}


@Component({
  selector: 'app-vendors',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],

  templateUrl: './vendors.html',

  styleUrl: './vendors.scss'
})
export class Vendors implements OnInit {

  vendors: Vendor[] = [];

  categories: string[] =
    [...VENDOR_CATEGORIES];

  statuses: string[] =
    [...VENDOR_STATUSES];


  selectedCategory = '';

  selectedStatus = '';


  showForm = false;

  loading = false;

  saving = false;


  editingVendorId: number | null = null;


  successMessage = '';

  errorMessage = '';


  vendorForm: FormGroup<VendorForm>;


  constructor(
    private fb: FormBuilder,

    private vendorService: VendorService
  ) {

    this.vendorForm =
      this.fb.nonNullable.group({

        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(150)
          ]
        ],

        category: [
          '',
          Validators.required
        ],

        contact_person: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100)
          ]
        ],

        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        phone: [
          '',
          [
            Validators.required,
            Validators.minLength(5),
            Validators.maxLength(30)
          ]
        ],

        location: [
          '',
          Validators.maxLength(150)
        ],

        contract_details: [
          '',
          Validators.maxLength(500)
        ]

      });

  }


  ngOnInit(): void {

    this.loadCategories();

    this.loadStatuses();

    this.loadVendors();

  }


  loadCategories(): void {

    this.categories =
      [...VENDOR_CATEGORIES];

    this.vendorService
      .getCategories()
      .subscribe({

        next: (response) => {

          if (
            Array.isArray(response.categories) &&
            response.categories.length === 6
          ) {

            this.categories =
              [...response.categories];

          }

        },

        error: () => {

          this.categories =
            [...VENDOR_CATEGORIES];

        }

      });

  }


  loadStatuses(): void {

    this.statuses =
      [...VENDOR_STATUSES];

    this.vendorService
      .getStatuses()
      .subscribe({

        next: (response) => {

          if (
            Array.isArray(response.statuses) &&
            response.statuses.length > 0
          ) {

            this.statuses =
              [...response.statuses];

          }

        },

        error: () => {

          this.statuses =
            [...VENDOR_STATUSES];

        }

      });

  }


  loadVendors(): void {

    this.loading = true;

    this.clearMessages();

    this.vendorService
      .getVendors(
        this.selectedCategory || undefined,
        this.selectedStatus || undefined
      )
      .pipe(

        finalize(() => {

          this.loading = false;

        })

      )
      .subscribe({

        next: (vendors) => {

          this.vendors = vendors;

        },

        error: (error: HttpErrorResponse) => {

          console.error(
            'Failed to load vendors:',
            error
          );

          this.vendors = [];

          if (error.status === 401) {

            this.errorMessage =
              'Your session has expired. Please login again.';

          }
          else if (error.status === 0) {

            this.errorMessage =
              'Backend server is not running.';

          }
          else {

            this.errorMessage =
              error.error?.detail ||
              'Failed to load vendors.';

          }

        }

      });

  }


  applyFilters(): void {

    this.loadVendors();

  }


  clearFilters(): void {

    this.selectedCategory = '';

    this.selectedStatus = '';

    this.loadVendors();

  }


  openCreateForm(): void {

    this.editingVendorId = null;

    this.vendorForm.reset({

      name: '',

      category: '',

      contact_person: '',

      email: '',

      phone: '',

      location: '',

      contract_details: ''

    });

    this.clearMessages();

    this.showForm = true;

  }


  openEditForm(
    vendor: Vendor
  ): void {

    this.editingVendorId =
      vendor.id;


    if (
      vendor.category &&
      !this.categories.includes(
        vendor.category
      )
    ) {

      this.categories = [
        ...this.categories,
        vendor.category
      ];

    }


    this.vendorForm.reset({

      name: vendor.name ?? '',

      category:
        vendor.category ?? '',

      contact_person:
        vendor.contact_person ?? '',

      email:
        vendor.email ?? '',

      phone:
        vendor.phone ?? '',

      location:
        vendor.location ?? '',

      contract_details:
        vendor.contract_details ?? ''

    });


    this.vendorForm.markAsPristine();

    this.vendorForm.markAsUntouched();

    this.clearMessages();

    this.showForm = true;

  }


  closeForm(): void {

    if (this.saving) {

      return;

    }

    this.showForm = false;

    this.editingVendorId = null;


    this.vendorForm.reset({

      name: '',

      category: '',

      contact_person: '',

      email: '',

      phone: '',

      location: '',

      contract_details: ''

    });

  }


  saveVendor(): void {

    this.clearMessages();


    if (this.vendorForm.invalid) {

      this.vendorForm.markAllAsTouched();

      this.errorMessage =
        'Please check the highlighted fields before saving.';

      return;

    }


    this.saving = true;


    const formValue =
      this.vendorForm.getRawValue();


    if (
      this.editingVendorId === null
    ) {

      const vendorData: VendorCreate = {

        name:
          formValue.name.trim(),

        category:
          formValue.category,

        contact_person:
          formValue.contact_person.trim(),

        email:
          formValue.email.trim(),

        phone:
          formValue.phone.trim(),

        location:
          formValue.location.trim() ||
          null,

        contract_details:
          formValue.contract_details.trim() ||
          null

      };


      this.vendorService
        .createVendor(vendorData)
        .pipe(

          finalize(() => {

            this.saving = false;

          })

        )
        .subscribe({

          next: (createdVendor) => {

            this.closeForm();

            this.vendors = [
              createdVendor,
              ...this.vendors
            ];

            this.successMessage =
              'Vendor created successfully.';

          },

          error: (
            error: HttpErrorResponse
          ) => {

            this.errorMessage =
              error.error?.detail ||
              'Failed to create vendor.';

          }

        });

      return;

    }


    const vendorData: VendorUpdate = {

      name:
        formValue.name.trim(),

      category:
        formValue.category,

      contact_person:
        formValue.contact_person.trim(),

      email:
        formValue.email.trim(),

      phone:
        formValue.phone.trim(),

      location:
        formValue.location.trim() ||
        null,

      contract_details:
        formValue.contract_details.trim() ||
        null

    };


    this.vendorService
      .updateVendor(
        this.editingVendorId,
        vendorData
      )
      .pipe(

        finalize(() => {

          this.saving = false;

        })

      )
      .subscribe({

        next: (updatedVendor) => {

          const index =
            this.vendors.findIndex(
              vendor =>
                vendor.id ===
                updatedVendor.id
            );


          if (index !== -1) {

            this.vendors[index] =
              updatedVendor;

          }


          this.closeForm();

          this.successMessage =
            'Vendor updated successfully.';

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage =
            error.error?.detail ||
            'Failed to update vendor.';

        }

      });

  }


  approveVendor(
    vendor: Vendor
  ): void {

    this.changeVendorStatus(
      vendor,
      'Approved'
    );

  }


  rejectVendor(
    vendor: Vendor
  ): void {

    this.changeVendorStatus(
      vendor,
      'Rejected'
    );

  }


  setPending(
    vendor: Vendor
  ): void {

    this.changeVendorStatus(
      vendor,
      'Pending'
    );

  }


  private changeVendorStatus(
    vendor: Vendor,
    newStatus: string
  ): void {

    this.clearMessages();

    this.vendorService
      .updateVendorStatus(
        vendor.id,
        newStatus
      )
      .subscribe({

        next: (updatedVendor) => {

          const index =
            this.vendors.findIndex(
              item =>
                item.id ===
                updatedVendor.id
            );


          if (index !== -1) {

            this.vendors[index] =
              updatedVendor;

          }


          this.successMessage =
            `Vendor status changed to ${newStatus}.`;

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage =
            error.error?.detail ||
            'Failed to update vendor status.';

        }

      });

  }


  deleteVendor(
    vendor: Vendor
  ): void {

    const confirmed =
      window.confirm(
        `Delete ${vendor.name}?`
      );


    if (!confirmed) {

      return;

    }


    this.vendorService
      .deleteVendor(vendor.id)
      .subscribe({

        next: () => {

          this.vendors =
            this.vendors.filter(
              item =>
                item.id !==
                vendor.id
            );

          this.successMessage =
            'Vendor deleted successfully.';

        },

        error: (
          error: HttpErrorResponse
        ) => {

          this.errorMessage =
            error.error?.detail ||
            'Failed to delete vendor.';

        }

      });

  }


  get totalCount(): number {

    return this.vendors.length;

  }


  get pendingCount(): number {

    return this.vendors.filter(
      vendor =>
        vendor.status === 'Pending'
    ).length;

  }


  get approvedCount(): number {

    return this.vendors.filter(
      vendor =>
        vendor.status === 'Approved'
    ).length;

  }


  get rejectedCount(): number {

    return this.vendors.filter(
      vendor =>
        vendor.status === 'Rejected'
    ).length;

  }


  formatScore(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {

      return '—';

    }

    return Number(value).toFixed(1);

  }


  clearMessages(): void {

    this.successMessage = '';

    this.errorMessage = '';

  }

}
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  NgForm
} from '@angular/forms';

import {
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderService,
  PURCHASE_ORDER_STATUSES,
  Invoice,
  InvoiceCreate,
  INVOICE_STATUSES
} from '../../core/services/purchase-order';

import {
  Vendor,
  VendorService
} from '../../core/services/vendor';

import {
  ProcurementRequest,
  ProcurementService
} from '../../core/services/procurement';

interface PurchaseOrderItemForm {
  item_description: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
}

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.scss'
})
export class PurchaseOrders implements OnInit {

  orders: PurchaseOrder[] = [];
  vendors: Vendor[] = [];
  procurementRequests: ProcurementRequest[] = [];
  invoices: Invoice[] = [];

  statuses = [...PURCHASE_ORDER_STATUSES];
  invoiceStatuses = [...INVOICE_STATUSES];

  filterStatus = '';

  loading = false;
  saving = false;
  invoiceSaving = false;

  showForm = false;
  showInvoiceForm = false;

  successMessage = '';
  errorMessage = '';

  sameAsShipping = false;

  form: PurchaseOrderCreate = this.createEmptyForm();

  invoiceForm: InvoiceCreate = {
    purchase_order_id: 0,
    invoice_number: '',
    invoice_date: this.getToday(),
    amount: 0
  };

  items: PurchaseOrderItemForm[] = [
    this.createEmptyItem()
  ];

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private vendorService: VendorService,
    private procurementService: ProcurementService
  ) {}

  ngOnInit(): void {
    this.loadVendors();
    this.loadProcurementRequests();
    this.loadOrders();
    this.loadInvoices();
  }

  createEmptyForm(): PurchaseOrderCreate {
    return {
      po_number: this.generatePoNumber(),
      order_date: this.getToday(),
      expected_delivery_date: this.getToday(),
      procurement_request_id: null,
      department: '',
      vendor_id: 0,
      payment_terms: '',
      shipping_address: '',
      billing_address: '',
      remarks: null,
      items: []
    };
  }

  createEmptyItem(): PurchaseOrderItemForm {
    return {
      item_description: '',
      quantity: 1,
      unit_price: 0,
      tax_percent: 0
    };
  }

  getToday(): string {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  generatePoNumber(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      now.getDate()
    ).padStart(2, '0');
    const time = String(
      now.getTime()
    ).slice(-6);

    return `PO-${year}${month}${day}-${time}`;
  }

  loadVendors(): void {

    this.vendorService.getVendors().subscribe({
      next: (vendors) => {
        this.vendors = vendors.filter(
          vendor => vendor.status === 'Approved'
        );
      },
      error: () => {
        this.vendors = [];
      }
    });
  }

  loadProcurementRequests(): void {

    this.procurementService
      .getRequests()
      .subscribe({
        next: (requests) => {
          this.procurementRequests = requests;
        },
        error: () => {
          this.procurementRequests = [];
        }
      });
  }

  loadOrders(): void {

    this.loading = true;
    this.errorMessage = '';

    this.purchaseOrderService
      .getOrders(
        this.filterStatus || undefined
      )
      .subscribe({
        next: (orders) => {
          this.orders = orders;
          this.loading = false;
        },

        error: (error) => {
          this.loading = false;

          this.handleApiError(
            error,
            'Unable to load purchase orders.'
          );
        }
      });
  }

  loadInvoices(): void {

    this.purchaseOrderService
      .getInvoices()
      .subscribe({
        next: (invoices) => {
          this.invoices = invoices;
        },
        error: () => {
          this.invoices = [];
        }
      });
  }

  openCreateForm(): void {

    this.form = this.createEmptyForm();

    this.items = [
      this.createEmptyItem()
    ];

    this.sameAsShipping = false;

    this.successMessage = '';
    this.errorMessage = '';

    this.showForm = true;
  }

  closeForm(): void {

    if (this.saving) {
      return;
    }

    this.showForm = false;
  }

  onShippingAddressChange(): void {

    if (this.sameAsShipping) {
      this.form.billing_address =
        this.form.shipping_address;
    }
  }

  toggleSameAddress(): void {

    if (this.sameAsShipping) {
      this.form.billing_address =
        this.form.shipping_address;
    }
  }

  addItem(): void {

    this.items.push(
      this.createEmptyItem()
    );
  }

  removeItem(index: number): void {

    if (this.items.length === 1) {
      return;
    }

    this.items.splice(index, 1);
  }

  itemSubtotal(
    item: PurchaseOrderItemForm
  ): number {

    return (
      this.toNumber(item.quantity) *
      this.toNumber(item.unit_price)
    );
  }

  itemTax(
    item: PurchaseOrderItemForm
  ): number {

    return (
      this.itemSubtotal(item) *
      this.toNumber(item.tax_percent)
    ) / 100;
  }

  itemTotal(
    item: PurchaseOrderItemForm
  ): number {

    return (
      this.itemSubtotal(item) +
      this.itemTax(item)
    );
  }

  get subtotal(): number {

    return this.items.reduce(
      (total, item) =>
        total + this.itemSubtotal(item),
      0
    );
  }

  get taxAmount(): number {

    return this.items.reduce(
      (total, item) =>
        total + this.itemTax(item),
      0
    );
  }

  get totalAmount(): number {

    return (
      this.subtotal +
      this.taxAmount
    );
  }

  savePurchaseOrder(
    formRef: NgForm
  ): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (
      formRef.invalid ||
      !this.isFormValid()
    ) {
      formRef.control.markAllAsTouched();

      if (!this.form.vendor_id) {
        this.errorMessage =
          'Please select an approved vendor.';
      } else if (
        this.form.expected_delivery_date <
        this.form.order_date
      ) {
        this.errorMessage =
          'Expected delivery date cannot be before order date.';
      } else if (
        this.items.length === 0
      ) {
        this.errorMessage =
          'At least one order item is required.';
      }

      return;
    }

    this.saving = true;

    const payload: PurchaseOrderCreate = {
      ...this.form,
      items: this.items.map(item => ({
        item_description:
          item.item_description,
        quantity:
          this.toNumber(item.quantity),
        unit_price:
          this.toNumber(item.unit_price),
        tax_percent:
          this.toNumber(item.tax_percent)
      }))
    };

    this.purchaseOrderService
      .createOrder(payload)
      .subscribe({
        next: (order) => {

          this.orders = [
            order,
            ...this.orders
          ];

          this.successMessage =
            `Purchase order ${order.po_number} created successfully.`;

          this.showForm = false;
          this.saving = false;
        },

        error: (error) => {

          this.saving = false;

          this.handleApiError(
            error,
            'Unable to create purchase order.'
          );
        }
      });
  }

  isFormValid(): boolean {

    if (!this.form.po_number.trim()) {
      return false;
    }

    if (!this.form.department.trim()) {
      return false;
    }

    if (!this.form.vendor_id) {
      return false;
    }

    if (!this.form.payment_terms.trim()) {
      return false;
    }

    if (!this.form.shipping_address.trim()) {
      return false;
    }

    if (!this.form.billing_address.trim()) {
      return false;
    }

    if (
      this.form.expected_delivery_date <
      this.form.order_date
    ) {
      return false;
    }

    if (this.items.length === 0) {
      return false;
    }

    return this.items.every(item =>
      item.item_description.trim().length >= 2 &&
      this.toNumber(item.quantity) > 0 &&
      this.toNumber(item.unit_price) >= 0 &&
      this.toNumber(item.tax_percent) >= 0 &&
      this.toNumber(item.tax_percent) <= 100
    );
  }

  changeStatus(
    order: PurchaseOrder,
    newStatus: string
  ): void {

    if (order.status === newStatus) {
      return;
    }

    this.purchaseOrderService
      .updateStatus(
        order.id,
        newStatus
      )
      .subscribe({
        next: (updatedOrder) => {

          this.orders = this.orders.map(
            existing =>
              existing.id === updatedOrder.id
                ? updatedOrder
                : existing
          );

          this.successMessage =
            `PO ${order.po_number} status changed to ${newStatus}.`;
        },

        error: (error) => {

          this.handleApiError(
            error,
            'Unable to update purchase order status.'
          );

          this.loadOrders();
        }
      });
  }

  deleteOrder(
    order: PurchaseOrder
  ): void {

    const confirmed = window.confirm(
      `Delete purchase order ${order.po_number}?`
    );

    if (!confirmed) {
      return;
    }

    this.purchaseOrderService
      .deleteOrder(order.id)
      .subscribe({
        next: () => {

          this.orders = this.orders.filter(
            existing =>
              existing.id !== order.id
          );

          this.invoices =
            this.invoices.filter(
              invoice =>
                invoice.purchase_order_id !==
                order.id
            );

          this.successMessage =
            'Purchase order deleted successfully.';
        },

        error: (error) => {

          this.handleApiError(
            error,
            'Unable to delete purchase order.'
          );
        }
      });
  }

  openInvoiceForm(
    order?: PurchaseOrder
  ): void {

    this.invoiceForm = {
      purchase_order_id:
        order?.id ?? 0,
      invoice_number: '',
      invoice_date:
        this.getToday(),
      amount:
        order
          ? this.toNumber(order.total_amount)
          : 0
    };

    this.successMessage = '';
    this.errorMessage = '';

    this.showInvoiceForm = true;
  }

  closeInvoiceForm(): void {

    if (this.invoiceSaving) {
      return;
    }

    this.showInvoiceForm = false;
  }

  saveInvoice(
    formRef: NgForm
  ): void {

    if (
      formRef.invalid ||
      !this.invoiceForm.purchase_order_id ||
      this.invoiceForm.amount < 0
    ) {
      formRef.control.markAllAsTouched();
      return;
    }

    this.invoiceSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.purchaseOrderService
      .createInvoice(this.invoiceForm)
      .subscribe({
        next: (invoice) => {

          this.invoices = [
            invoice,
            ...this.invoices
          ];

          this.successMessage =
            `Invoice ${invoice.invoice_number} created successfully.`;

          this.showInvoiceForm = false;
          this.invoiceSaving = false;
        },

        error: (error) => {

          this.invoiceSaving = false;

          this.handleApiError(
            error,
            'Unable to create invoice.'
          );
        }
      });
  }

  changeInvoiceStatus(
    invoice: Invoice,
    newStatus: string
  ): void {

    if (invoice.status === newStatus) {
      return;
    }

    this.purchaseOrderService
      .updateInvoiceStatus(
        invoice.id,
        newStatus
      )
      .subscribe({
        next: (updatedInvoice) => {

          this.invoices =
            this.invoices.map(
              existing =>
                existing.id ===
                updatedInvoice.id
                  ? updatedInvoice
                  : existing
            );

          this.successMessage =
            `Invoice ${invoice.invoice_number} marked ${newStatus}.`;
        },

        error: (error) => {

          this.handleApiError(
            error,
            'Unable to update invoice status.'
          );
        }
      });
  }

  onStatusFilterChange(): void {
    this.loadOrders();
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get pendingOrders(): number {
    return this.countStatus('Pending');
  }

  get approvedOrders(): number {
    return this.countStatus('Approved');
  }

  get orderedOrders(): number {
    return this.countStatus('Ordered');
  }

  get deliveredOrders(): number {
    return this.countStatus('Delivered');
  }

  get completedOrders(): number {
    return this.countStatus('Completed');
  }

  get cancelledOrders(): number {
    return this.countStatus('Cancelled');
  }

  get activeOrders(): number {

    return this.orders.filter(
      order =>
        order.status !== 'Completed' &&
        order.status !== 'Cancelled'
    ).length;
  }

  get totalPOValue(): number {

    return this.orders.reduce(
      (total, order) =>
        total +
        this.toNumber(order.total_amount),
      0
    );
  }

  get overdueOrders(): number {

    return this.orders.filter(
      order => this.isOverdue(order)
    ).length;
  }

  get onTimeDeliveries(): number {

    return this.orders.filter(
      order =>
        order.status === 'Delivered' ||
        order.status === 'Completed'
    ).length;
  }

  get delayedDeliveries(): number {

    return this.orders.filter(
      order =>
        this.isOverdue(order)
    ).length;
  }

  get pendingDeliveries(): number {

    return this.orders.filter(
      order =>
        order.status === 'Approved' ||
        order.status === 'Ordered'
    ).length;
  }

  get deliveryRate(): number {

    const finishedOrders =
      this.orders.filter(
        order =>
          order.status === 'Delivered' ||
          order.status === 'Completed'
      );

    const eligibleOrders =
      this.orders.filter(
        order =>
          order.status !== 'Cancelled'
      );

    if (eligibleOrders.length === 0) {
      return 0;
    }

    return (
      finishedOrders.length /
      eligibleOrders.length
    ) * 100;
  }

  get invoiceTotal(): number {

    return this.invoices.reduce(
      (total, invoice) =>
        total +
        this.toNumber(invoice.amount),
      0
    );
  }

  get pendingInvoiceCount(): number {

    return this.invoices.filter(
      invoice =>
        invoice.status === 'Pending'
    ).length;
  }

  getVendorName(
    vendorId: number
  ): string {

    const vendor =
      this.vendors.find(
        item => item.id === vendorId
      );

    return vendor
      ? vendor.name
      : `Vendor #${vendorId}`;
  }

  getProcurementRequestTitle(
    requestId: number | null
  ): string {

    if (!requestId) {
      return 'Not linked';
    }

    const request =
      this.procurementRequests.find(
        item => item.id === requestId
      );

    return request
      ? `#${request.id} - ${request.title}`
      : `Request #${requestId}`;
  }

  countStatus(
    status: string
  ): number {

    return this.orders.filter(
      order =>
        order.status === status
    ).length;
  }

  isOverdue(
    order: PurchaseOrder
  ): boolean {

    if (
      order.status === 'Delivered' ||
      order.status === 'Completed' ||
      order.status === 'Cancelled'
    ) {
      return false;
    }

    return (
      order.expected_delivery_date <
      this.getToday()
    );
  }

  deliveryLabel(
    order: PurchaseOrder
  ): string {

    if (order.status === 'Delivered') {
      return 'Delivered';
    }

    if (order.status === 'Completed') {
      return 'Completed';
    }

    if (this.isOverdue(order)) {
      return 'Overdue';
    }

    return order.expected_delivery_date;
  }

  formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }
    ).format(
      this.toNumber(value)
    );
  }

  formatDate(
    value: string
  ): string {

    if (!value) {
      return '—';
    }

    return new Date(value)
      .toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }
      );
  }

  toNumber(
    value: number | string | null | undefined
  ): number {

    const result = Number(value ?? 0);

    return Number.isFinite(result)
      ? result
      : 0;
  }

  handleApiError(
    error: any,
    fallbackMessage: string
  ): void {

    if (error?.status === 401) {
      this.errorMessage =
        'Your session has expired. Please log in again.';
      return;
    }

    if (error?.status === 403) {
      this.errorMessage =
        'You do not have permission to perform this action.';
      return;
    }

    if (error?.status === 404) {
      this.errorMessage =
        'The requested record was not found.';
      return;
    }

    if (error?.error?.detail) {
      this.errorMessage =
        error.error.detail;
      return;
    }

    this.errorMessage =
      fallbackMessage;
  }
}
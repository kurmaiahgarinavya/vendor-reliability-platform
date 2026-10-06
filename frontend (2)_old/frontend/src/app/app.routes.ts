import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Vendors } from './pages/vendors/vendors';
import { Procurement } from './pages/procurement/procurement';
import { PurchaseOrders } from './pages/purchase-orders/purchase-orders';
import { Contracts } from './pages/contracts/contracts';
import { CommunicationPage } from './pages/communication/communication';
import { Performance } from './pages/performance/performance';
import { Reliability } from './pages/reliability/reliability';
import { Analytics } from './pages/analytics/analytics';
import { Notifications } from './pages/notifications/notifications';
import { Reports } from './pages/reports/reports';
import { Users } from './pages/users/users';
import { Profile } from './pages/profile/profile';
import { MainLayout } from './layout/main-layout/main-layout';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';

export const routes: Routes = [

  // =========================
  // PUBLIC ROUTES
  // =========================

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  {
    path: 'forgot-password',
    component: ForgotPassword
  },

  {
    path: 'reset-password',
    component: ResetPassword
  },

  // =========================
  // PROTECTED ROUTES
  // =========================

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],

    children: [

      // =========================
      // DASHBOARD
      // All authenticated roles
      // =========================

      {
        path: 'dashboard',
        component: Dashboard
      },

      // =========================
      // VENDOR PROFILE
      // Vendor only
      // =========================

      {
        path: 'profile',
        component: Profile,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Vendor'
          ]
        }
      },

      // =========================
      // VENDOR MANAGEMENT
      // Management roles only
      // =========================

      {
        path: 'vendors',
        component: Vendors,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager'
          ]
        }
      },

      // =========================
      // PROCUREMENT
      // Management + Vendor
      // =========================

      {
        path: 'procurement',
        component: Procurement,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Vendor'
          ]
        }
      },

      // =========================
      // PURCHASE ORDERS
      // Management + Vendor
      // =========================

      {
        path: 'purchase-orders',
        component: PurchaseOrders,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Vendor'
          ]
        }
      },

      // =========================
      // CONTRACTS
      // =========================

      {
        path: 'contracts',
        component: Contracts,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Vendor',
            'Auditor'
          ]
        }
      },

      // =========================
      // COMMUNICATION
      // =========================

      {
        path: 'communication',
        component: CommunicationPage,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Vendor'
          ]
        }
      },

      // =========================
      // PERFORMANCE
      // =========================

      {
        path: 'performance',
        component: Performance,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Vendor',
            'Auditor'
          ]
        }
      },

      // =========================
      // RELIABILITY
      // =========================

      {
        path: 'reliability',
        component: Reliability,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Vendor',
            'Auditor'
          ]
        }
      },

      // =========================
      // ANALYTICS
      // =========================

      {
        path: 'analytics',
        component: Analytics,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Auditor'
          ]
        }
      },

      // =========================
      // NOTIFICATIONS
      // All authenticated roles
      // =========================

      {
        path: 'notifications',
        component: Notifications
      },

      // =========================
      // REPORTS
      // =========================

      {
        path: 'reports',
        component: Reports,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator',
            'Procurement Manager',
            'Supply Chain Manager',
            'Finance Officer',
            'Auditor'
          ]
        }
      },

      // =========================
      // USER MANAGEMENT
      // Administrator only
      // =========================

      {
        path: 'users',
        component: Users,
        canActivate: [roleGuard],
        data: {
          roles: [
            'Administrator'
          ]
        }
      }

    ]
  },

  // =========================
  // UNKNOWN ROUTES
  // =========================

  {
    path: '**',
    redirectTo: 'login'
  }

];
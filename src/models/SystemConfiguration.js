import mongoose from "mongoose";

const SystemConfigurationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "Real Estate CRM",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    currency: {
      type: String,
      enum: ["ETB", "USD"],
      default: "ETB",
    },

    timezone: {
      type: String,
      default: "Africa/Addis_Ababa",
    },

    crm: {
      leadManagementEnabled: {
        type: Boolean,
        default: true,
      },

      defaultLeadStatus: {
        type: String,
        enum: ["new", "contacted", "qualified"],
        default: "new",
      },

      followUpReminder: {
        type: Number,
        enum: [12, 24, 48, 72],
        default: 24,
      },

      autoLeadAssignment: {
        type: Boolean,
        default: false,
      },

      appointmentsEnabled: {
        type: Boolean,
        default: true,
      },

      appointmentDuration: {
        type: Number,
        enum: [30, 60, 90, 120],
        default: 60,
      },

      allowClientRescheduling: {
        type: Boolean,
        default: true,
      },

      requireAgentConfirmation: {
        type: Boolean,
        default: true,
      },

      clientRegistrationEnabled: {
        type: Boolean,
        default: true,
      },

      allowClientPreferenceUpdates: {
        type: Boolean,
        default: true,
      },

      requireClientPhone: {
        type: Boolean,
        default: true,
      },

      notificationsEnabled: {
        type: Boolean,
        default: true,
      },

      leadAssignmentNotifications: {
        type: Boolean,
        default: true,
      },

      appointmentNotifications: {
        type: Boolean,
        default: true,
      },

      paymentNotifications: {
        type: Boolean,
        default: true,
      },
    },

    properties: {
      propertyManagementEnabled: {
        type: Boolean,
        default: true,
      },

      allowNewListings: {
        type: Boolean,
        default: true,
      },

      requireImages: {
        type: Boolean,
        default: true,
      },

      minimumImages: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        default: 1,
      },

      defaultStatus: {
        type: String,
        enum: ["available", "pending", "sold", "rented"],
        default: "available",
      },

      defaultCurrency: {
        type: String,
        enum: ["ETB", "USD"],
        default: "ETB",
      },

      defaultPropertyType: {
        type: String,
        enum: ["house", "apartment", "villa", "land", "commercial", "other"],
        default: "apartment",
      },

      allowEditing: {
        type: Boolean,
        default: true,
      },

      allowDeletion: {
        type: Boolean,
        default: true,
      },

      requireDescription: {
        type: Boolean,
        default: true,
      },

      requireLocation: {
        type: Boolean,
        default: true,
      },

      recommendationsEnabled: {
        type: Boolean,
        default: true,
      },

      virtualToursEnabled: {
        type: Boolean,
        default: true,
      },

      favoritesEnabled: {
        type: Boolean,
        default: true,
      },
    },

    sales: {
      paymentsEnabled: {
        type: Boolean,
        default: true,
      },

      chapaEnabled: {
        type: Boolean,
        default: true,
      },

      automaticPaymentVerification: {
        type: Boolean,
        default: true,
      },

      managerApprovalForExceptions: {
        type: Boolean,
        default: true,
      },

      installmentsEnabled: {
        type: Boolean,
        default: true,
      },

      minimumInstallments: {
        type: Number,
        default: 2,
        min: 1,
        max: 60,
      },

      maximumInstallments: {
        type: Number,
        default: 12,
        min: 1,
        max: 60,
      },

      minimumDownPayment: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },

      paymentGracePeriod: {
        type: Number,
        default: 7,
        min: 0,
        max: 90,
      },

      salesManagementEnabled: {
        type: Boolean,
        default: true,
      },

      defaultSalesCurrency: {
        type: String,
        enum: ["ETB", "USD"],
        default: "ETB",
      },

      agentCommissionRate: {
        type: Number,
        default: 2,
        min: 0,
        max: 100,
      },

      paymentNotificationsEnabled: {
        type: Boolean,
        default: true,
      },

      paymentConfirmationNotifications: {
        type: Boolean,
        default: true,
      },

      paymentFailureNotifications: {
        type: Boolean,
        default: true,
      },

      installmentDueNotifications: {
        type: Boolean,
        default: true,
      },
    },

    preferences: {
      theme: {
        type: String,
        enum: ["system", "light", "dark"],
        default: "system",
      },
      sidebarCollapsed: {
        type: Boolean,
        default: false,
      },
      compactMode: {
        type: Boolean,
        default: false,
      },
      showBreadcrumbs: {
        type: Boolean,
        default: true,
      },
      dateFormat: {
        type: String,
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
        default: "DD/MM/YYYY",
      },
      timeFormat: {
        type: String,
        enum: ["12-hour", "24-hour"],
        default: "24-hour",
      },
      weekStartsOn: {
        type: String,
        enum: ["monday", "sunday"],
        default: "monday",
      },
      systemNotificationsEnabled: {
        type: Boolean,
        default: true,
      },
      emailNotificationsEnabled: {
        type: Boolean,
        default: true,
      },
      inAppNotificationsEnabled: {
        type: Boolean,
        default: true,
      },
      notificationSoundEnabled: {
        type: Boolean,
        default: true,
      },
      showStatisticsCards: {
        type: Boolean,
        default: true,
      },
      showRecentActivity: {
        type: Boolean,
        default: true,
      },
      showQuickActions: {
        type: Boolean,
        default: true,
      },
      recordsPerPage: {
        type: Number,
        enum: [10, 20, 30, 50],
        default: 10,
      },
      confirmBeforeDelete: {
        type: Boolean,
        default: true,
      },
      autoRefreshData: {
        type: Boolean,
        default: true,
      },
      autoRefreshInterval: {
        type: Number,
        enum: [30, 60, 120, 300],
        default: 60,
      },
    },
    security: {
      requireStrongPasswords: {
        type: Boolean,
        default: true,
      },
      passwordMinimumLength: {
        type: Number,
        default: 8,
        min: 6,
        max: 32,
      },
      requireEmailVerification: {
        type: Boolean,
        default: false,
      },
      sessionTimeout: {
        type: Number,
        default: 60,
        enum: [15, 30, 60, 120, 240],
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        enum: [3, 5, 10],
      },
      accountLockoutDuration: {
        type: Number,
        default: 15,
        enum: [5, 15, 30, 60],
      },

      twoFactorAuthentication: {
        type: Boolean,
        default: false,
      },
      require2FAForAdmins: {
        type: Boolean,
        default: false,
      },
      require2FAForManagers: {
        type: Boolean,
        default: false,
      },

      loginNotifications: {
        type: Boolean,
        default: true,
      },
      trackFailedLoginAttempts: {
        type: Boolean,
        default: true,
      },
      accountLockout: {
        type: Boolean,
        default: true,
      },
      allowMultipleActiveSessions: {
        type: Boolean,
        default: true,
      },

      auditLogging: {
        type: Boolean,
        default: true,
      },
      logUserChanges: {
        type: Boolean,
        default: true,
      },
      logPropertyChanges: {
        type: Boolean,
        default: true,
      },
      logSalesPaymentChanges: {
        type: Boolean,
        default: true,
      },
      logAuthenticationEvents: {
        type: Boolean,
        default: true,
      },

      confirmSensitiveAdminActions: {
        type: Boolean,
        default: true,
      },
      requirePasswordForCriticalActions: {
        type: Boolean,
        default: true,
      },
      protectAdminAccounts: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const SystemConfiguration =
  mongoose.models.SystemConfiguration ||
  mongoose.model("SystemConfiguration", SystemConfigurationSchema);

export default SystemConfiguration;


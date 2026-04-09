// All available permissions in the system
export const ALL_PERMISSIONS = [
  // Vehicles
  'vehicle.view',        // View vehicles at own station
  'vehicle.create',      // Create new vehicle entries
  'vehicle.edit',        // Edit existing vehicle details
  'vehicle.delete',      // Delete vehicle entries
  'vehicle.view_all',    // View vehicles from ALL stations (cross-station)

  // Payments
  'payment.view',        // View payment history
  'payment.add',         // Add payment entries

  // Documents
  'document.view',       // View uploaded RC / ID proof documents
  'document.upload',     // Upload new documents

  // Reports
  'report.view',         // View daily register
  'report.export',       // Export PDF / Excel reports

  // Service Reminders
  'reminder.view',       // View service reminders
  'reminder.manage',     // Snooze / complete / update reminders

  // Stations
  'station.view',        // View list of stations
  'station.create',      // Create new stations
  'station.edit',        // Edit station details
  'station.delete',      // Deactivate / delete stations
  'station.switch',      // Switch between stations in the UI

  // Staff / Users
  'staff.view',          // View staff list
  'staff.create',        // Create new staff accounts
  'staff.edit',          // Edit staff details and permissions
  'staff.deactivate',    // Deactivate staff accounts
  'staff.reset_password',// Reset / update staff passwords

  // Dashboard
  'dashboard.view',      // View dashboard stats
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

// Role templates — predefined permission sets
export const ROLE_TEMPLATES: Record<string, Permission[]> = {
  admin: [...ALL_PERMISSIONS] as Permission[],

  station_manager: [
    'vehicle.view', 'vehicle.create', 'vehicle.edit', 'vehicle.delete',
    'payment.view', 'payment.add',
    'document.view', 'document.upload',
    'report.view', 'report.export',
    'reminder.view', 'reminder.manage',
    'station.view', 'station.switch',
    'staff.view',
    'dashboard.view',
  ],

  receptionist: [
    'vehicle.view', 'vehicle.create',
    'payment.view', 'payment.add',
    'document.view', 'document.upload',
    'report.view', 'report.export',
    'reminder.view',
    'dashboard.view',
  ],

  mechanic: [
    'vehicle.view', 'vehicle.edit',
    'document.view',
    'reminder.view', 'reminder.manage',
    'dashboard.view',
  ],

  accountant: [
    'vehicle.view',
    'payment.view', 'payment.add',
    'report.view', 'report.export',
    'dashboard.view',
  ],

  basic_staff: [
    'vehicle.view', 'vehicle.create',
    'dashboard.view',
  ],
};

// Permission groups for UI display
export const PERMISSION_GROUPS = [
  {
    key: 'vehicles',
    label: 'Vehicles',
    icon: '🏍️',
    permissions: [
      { key: 'vehicle.view', label: 'View vehicles (own station)' },
      { key: 'vehicle.create', label: 'Create vehicle entries' },
      { key: 'vehicle.edit', label: 'Edit vehicle details' },
      { key: 'vehicle.delete', label: 'Delete vehicles' },
      { key: 'vehicle.view_all', label: 'View all stations vehicles' },
    ],
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: '💰',
    permissions: [
      { key: 'payment.view', label: 'View payment history' },
      { key: 'payment.add', label: 'Add payment entries' },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: '📄',
    permissions: [
      { key: 'document.view', label: 'View uploaded documents' },
      { key: 'document.upload', label: 'Upload documents' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: '📊',
    permissions: [
      { key: 'report.view', label: 'View daily register' },
      { key: 'report.export', label: 'Export PDF / Excel' },
    ],
  },
  {
    key: 'reminders',
    label: 'Service Reminders',
    icon: '🔔',
    permissions: [
      { key: 'reminder.view', label: 'View service reminders' },
      { key: 'reminder.manage', label: 'Manage / snooze reminders' },
    ],
  },
  {
    key: 'stations',
    label: 'Stations',
    icon: '🏢',
    permissions: [
      { key: 'station.view', label: 'View station list' },
      { key: 'station.create', label: 'Create stations' },
      { key: 'station.edit', label: 'Edit station details' },
      { key: 'station.delete', label: 'Deactivate stations' },
      { key: 'station.switch', label: 'Switch between stations' },
    ],
  },
  {
    key: 'staff',
    label: 'Staff Management',
    icon: '👥',
    permissions: [
      { key: 'staff.view', label: 'View staff list' },
      { key: 'staff.create', label: 'Create staff accounts' },
      { key: 'staff.edit', label: 'Edit staff & permissions' },
      { key: 'staff.deactivate', label: 'Deactivate staff' },
      { key: 'staff.reset_password', label: 'Reset staff passwords' },
    ],
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '📈',
    permissions: [
      { key: 'dashboard.view', label: 'View dashboard statistics' },
    ],
  },
] as const;

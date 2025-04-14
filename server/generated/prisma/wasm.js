
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  firstName: 'firstName',
  lastName: 'lastName',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isActive: 'isActive',
  practiceId: 'practiceId',
  resetToken: 'resetToken',
  resetTokenExpiry: 'resetTokenExpiry'
};

exports.Prisma.PracticeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  logo: 'logo',
  subscriptionTier: 'subscriptionTier',
  subscriptionStatus: 'subscriptionStatus',
  subscriptionStartDate: 'subscriptionStartDate',
  subscriptionEndDate: 'subscriptionEndDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isActive: 'isActive',
  customBranding: 'customBranding',
  maxStorage: 'maxStorage',
  currentStorage: 'currentStorage'
};

exports.Prisma.SubscriptionHistoryScalarFieldEnum = {
  id: 'id',
  practiceId: 'practiceId',
  tier: 'tier',
  startDate: 'startDate',
  endDate: 'endDate',
  amount: 'amount',
  paymentId: 'paymentId',
  createdAt: 'createdAt'
};

exports.Prisma.PatientScalarFieldEnum = {
  id: 'id',
  name: 'name',
  species: 'species',
  breed: 'breed',
  age: 'age',
  weight: 'weight',
  sex: 'sex',
  practiceId: 'practiceId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isActive: 'isActive',
  ownerId: 'ownerId',
  ownerName: 'ownerName',
  ownerEmail: 'ownerEmail',
  ownerPhone: 'ownerPhone',
  medicalHistory: 'medicalHistory'
};

exports.Prisma.MonitoringPlanScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  protocol: 'protocol',
  practiceId: 'practiceId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  isTemplate: 'isTemplate',
  shareToken: 'shareToken'
};

exports.Prisma.MonitoringPlanPatientScalarFieldEnum = {
  id: 'id',
  monitoringPlanId: 'monitoringPlanId',
  patientId: 'patientId',
  enrollmentDate: 'enrollmentDate',
  exitDate: 'exitDate',
  isActive: 'isActive'
};

exports.Prisma.MonitoringPlanAssignmentScalarFieldEnum = {
  id: 'id',
  monitoringPlanId: 'monitoringPlanId',
  userId: 'userId',
  assignedAt: 'assignedAt',
  role: 'role'
};

exports.Prisma.MonitoringPlanNoteScalarFieldEnum = {
  id: 'id',
  monitoringPlanId: 'monitoringPlanId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SymptomTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  category: 'category',
  dataType: 'dataType',
  units: 'units',
  minValue: 'minValue',
  maxValue: 'maxValue',
  options: 'options',
  monitoringPlanId: 'monitoringPlanId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ObservationScalarFieldEnum = {
  id: 'id',
  symptomTemplateId: 'symptomTemplateId',
  patientId: 'patientId',
  monitoringPlanPatientId: 'monitoringPlanPatientId',
  recordedById: 'recordedById',
  recordedAt: 'recordedAt',
  value: 'value',
  notes: 'notes'
};

exports.Prisma.TreatmentTemplateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  protocol: 'protocol',
  monitoringPlanId: 'monitoringPlanId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TreatmentScalarFieldEnum = {
  id: 'id',
  templateId: 'templateId',
  patientId: 'patientId',
  monitoringPlanPatientId: 'monitoringPlanPatientId',
  createdById: 'createdById',
  createdAt: 'createdAt',
  administeredAt: 'administeredAt',
  name: 'name',
  description: 'description',
  dosage: 'dosage',
  notes: 'notes'
};

exports.Prisma.AlertThresholdScalarFieldEnum = {
  id: 'id',
  symptomTemplateId: 'symptomTemplateId',
  condition: 'condition',
  severity: 'severity',
  message: 'message',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AlertScalarFieldEnum = {
  id: 'id',
  thresholdId: 'thresholdId',
  observationId: 'observationId',
  triggeredAt: 'triggeredAt',
  resolvedAt: 'resolvedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  message: 'message',
  alertId: 'alertId',
  createdAt: 'createdAt',
  readAt: 'readAt',
  isRead: 'isRead'
};

exports.Prisma.FileScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  filepath: 'filepath',
  mimetype: 'mimetype',
  size: 'size',
  createdAt: 'createdAt',
  patientId: 'patientId',
  observationId: 'observationId',
  treatmentId: 'treatmentId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  PRACTICE_OWNER: 'PRACTICE_OWNER',
  VETERINARIAN: 'VETERINARIAN',
  TECHNICIAN: 'TECHNICIAN',
  ASSISTANT: 'ASSISTANT',
  RECEPTIONIST: 'RECEPTIONIST'
};

exports.SubscriptionTier = exports.$Enums.SubscriptionTier = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  TRIAL: 'TRIAL'
};

exports.SubscriptionStatus = exports.$Enums.SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELED: 'CANCELED',
  TRIAL: 'TRIAL'
};

exports.Sex = exports.$Enums.Sex = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  UNKNOWN: 'UNKNOWN'
};

exports.MonitoringPlanStatus = exports.$Enums.MonitoringPlanStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

exports.MonitoringPlanRole = exports.$Enums.MonitoringPlanRole = {
  LEAD_RESEARCHER: 'LEAD_RESEARCHER',
  RESEARCHER: 'RESEARCHER',
  OBSERVER: 'OBSERVER',
  ASSISTANT: 'ASSISTANT'
};

exports.SymptomDataType = exports.$Enums.SymptomDataType = {
  NUMERIC: 'NUMERIC',
  BOOLEAN: 'BOOLEAN',
  SCALE: 'SCALE',
  ENUMERATION: 'ENUMERATION',
  TEXT: 'TEXT',
  IMAGE: 'IMAGE'
};

exports.AlertSeverity = exports.$Enums.AlertSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

exports.Prisma.ModelName = {
  User: 'User',
  Practice: 'Practice',
  SubscriptionHistory: 'SubscriptionHistory',
  Patient: 'Patient',
  MonitoringPlan: 'MonitoringPlan',
  MonitoringPlanPatient: 'MonitoringPlanPatient',
  MonitoringPlanAssignment: 'MonitoringPlanAssignment',
  MonitoringPlanNote: 'MonitoringPlanNote',
  SymptomTemplate: 'SymptomTemplate',
  Observation: 'Observation',
  TreatmentTemplate: 'TreatmentTemplate',
  Treatment: 'Treatment',
  AlertThreshold: 'AlertThreshold',
  Alert: 'Alert',
  Notification: 'Notification',
  File: 'File'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

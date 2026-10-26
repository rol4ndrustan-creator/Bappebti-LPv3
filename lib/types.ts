// ---------------------------------------------------------------------------
// Legacy types (kept for backward compatibility with existing pages/components)
// ---------------------------------------------------------------------------

export type Severity = "Rendah" | "Sedang" | "Tinggi" | "Kritis";

/** @deprecated superseded by PublicStatus / InternalWorkflowState, kept for legacy pages */
export type CaseStatus =
  | "Baru"
  | "Verifikasi"
  | "Diproses"
  | "Menunggu Klarifikasi"
  | "Resolusi Diajukan"
  | "Resolusi Disetujui"
  | "Selesai"
  | "Ditolak";

/** Whether a ticket was filed as a formal complaint or a general critique/suggestion. */
export type ComplaintType = "Pengaduan" | "Kritik dan Saran";

export type OwnerType = "Pelapor" | "Platform" | "Bursa" | "Kliring" | "Bappebti";

/** @deprecated superseded by the institution/responsibility structure below */
export type Responsibility = "BAPPEBTI OWNED" | "MEMBER ASSIGNED" | "WAITING PUBLIC";

export type SlaStatus = "Aman" | "Mendekati SLA" | "Lewat SLA";

export type TimelineStatus = "success" | "info" | "warning" | "danger";

export interface TimelineEvent {
  datetime: string;
  actor: string;
  role: string;
  action: string;
  note: string;
  status: TimelineStatus;
  /** Whether this event is visible to the public reporter. Internal-only events are never shown on public portals. */
  visibility?: "public" | "internal";
}

export interface ClarificationMessage {
  from: string;
  role: string;
  datetime: string;
  message: string;
  /** Distinguishes an informational note from a formal clarification request requiring a reply. */
  kind?: "info" | "formal-request" | "reply" | "resolution";
  dueDate?: string;
  requiresAttachment?: boolean;
}

// ---------------------------------------------------------------------------
// Richer regulator-grade data model (Section 4 of the product spec)
// All fields below are additive/optional so existing mock cases and pages
// keep working unchanged; new screens read these fields with safe fallbacks
// via the helpers in lib/workflow-config.ts and lib/format.ts.
// ---------------------------------------------------------------------------

/** Public-facing status shown to reporters (Bahasa Indonesia, plain language). */
export type PublicStatus =
  | "Draft"
  | "Pengaduan Diterima"
  | "Sedang Diperiksa"
  | "Menunggu Data dari Anda"
  | "Diteruskan ke Pihak Terkait"
  | "Sedang Diinvestigasi"
  | "Dalam Review Bappebti"
  | "Solusi Diajukan"
  | "Solusi Sedang Dilaksanakan"
  | "Selesai"
  | "Ditutup Secara Administratif"
  | "Dialihkan ke Instansi Lain"
  | "Di Luar Kewenangan"
  // Mekanisme Penanganan Perselisihan Nasabah PBK
  | "Verifikasi Bappebti"
  | "Perbaikan Berkas"
  | "Ditolak"
  | "Musyawarah dengan Pialang"
  | "Mediasi di Bursa"
  | "Penyampaian Kesepakatan"
  | "Pilihan Pengadilan/BAKTI"
  | "Diteruskan ke Pengadilan/BAKTI";

/** Internal workflow state driving routing, SLA clocks and permitted transitions. */
export type InternalWorkflowState =
  | "DRAFT"
  | "INTAKE_SUBMITTED"
  | "IDENTITY_VERIFICATION"
  | "JURISDICTION_REVIEW"
  | "COMPLETENESS_REVIEW"
  | "WAITING_REPORTER_INFORMATION"
  | "ROUTING_REVIEW"
  | "ASSIGNED_TO_PLATFORM"
  | "ASSIGNED_TO_BURSA"
  | "ASSIGNED_TO_CLEARING"
  | "MEMBER_ACKNOWLEDGED"
  | "MEMBER_INVESTIGATION"
  | "WAITING_MEMBER_INFORMATION"
  | "WAITING_SUPPORTING_INSTITUTION"
  | "BAPPEBTI_OPERATIONAL_REVIEW"
  | "BAPPEBTI_SUPERVISOR_REVIEW"
  | "ENFORCEMENT_REVIEW"
  | "PROPOSED_RESOLUTION"
  | "WAITING_REPORTER_DECISION"
  | "RESOLUTION_IMPLEMENTATION"
  | "IMPLEMENTATION_VERIFICATION"
  | "CLOSED_RESOLVED"
  | "CLOSED_ADMINISTRATIVE"
  | "REFERRED_EXTERNAL"
  | "OUTSIDE_JURISDICTION"
  | "WITHDRAWN_BY_REPORTER"
  | "REOPENED";

export type ReporterType =
  | "Perorangan"
  | "Badan Hukum"
  | "Kuasa/Perwakilan"
  | "Kuasa Hukum"
  | "Ahli Waris/Keluarga";

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export interface InstitutionStructure {
  /** Always Bappebti in this platform — the regulator ultimately accountable for the case. */
  regulatoryOwner: string;
  /** The member institution primarily responsible for resolving the complaint. */
  leadInstitution: string;
  /** Whoever must act right now: could be the lead institution, a supporting institution, Bappebti, or the reporter. */
  currentActionOwner: OwnerType;
  /** Named case officer assigned within the current action owner. */
  caseOfficer?: string;
  /** Other institutions supporting investigation without owning the action. */
  supportingInstitutions?: string[];
  bursa?: string;
  clearing?: string;
  supervisoryUnit?: string;
  /** Who has final authority to approve/close the case. */
  decisionAuthority: string;
  escalationLevel: EscalationLevel;
  escalationReason?: string;
}

export type SlaClockType =
  | "Pengakuan Awal"
  | "Review Yurisdiksi"
  | "Review Kelengkapan"
  | "Pengakuan Anggota"
  | "Respons Substantif Anggota"
  | "Respons Institusi Pendukung"
  | "Review Bappebti"
  | "Klarifikasi Pelapor"
  | "Implementasi Resolusi"
  | "Usia Kasus Keseluruhan"
  // Mekanisme Penanganan Perselisihan Nasabah PBK
  | "Verifikasi Materiil & Formil Bappebti"
  | "Klarifikasi Pialang Berjangka"
  | "Perbaikan Berkas Formil"
  | "Musyawarah Pialang"
  | "Mediasi Bursa"
  | "Laporan Hasil Mediasi ke Bappebti"
  | "Penyampaian Dokumen Kesepakatan"
  | "Pemilihan Pengadilan/BAKTI";

export type SlaClockStatus = "Aman" | "Perlu Perhatian" | "Mendekati Batas Waktu" | "Lewat Batas Waktu" | "Dijeda" | "Selesai";

export interface SlaClock {
  type: SlaClockType;
  startTime: string;
  deadline: string;
  status: SlaClockStatus;
  responsibleParty: OwnerType;
  paused?: boolean;
  pauseReason?: string;
  pauseStart?: string;
  resumeDate?: string;
  breachDate?: string;
  escalationLevel?: EscalationLevel;
}

export type ResolutionType =
  | "Pengembalian Dana"
  | "Koreksi Saldo"
  | "Pemulihan Akun"
  | "Penjelasan Transaksi"
  | "Penutupan Akun"
  | "Klarifikasi Tertulis"
  | "Perbaikan Layanan"
  | "Lainnya";

export type ReporterResolutionDecision =
  | "Menerima Sepenuhnya"
  | "Menerima Sebagian"
  | "Masalah Belum Selesai"
  | "Membutuhkan Penjelasan"
  | "Belum Dilaksanakan"
  | "Bukti Bertentangan"
  | "Meminta Review Bappebti";

export interface ResolutionRecord {
  proposal: string;
  resolutionType: ResolutionType;
  proposedBy: string;
  proposedDate: string;
  monetaryAdjustment?: number;
  nonMonetaryAction?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  implementationDeadline?: string;
  implementationEvidence?: string[];
  reporterDecision?: ReporterResolutionDecision;
  reporterDisagreementReason?: string;
  bappebtiDecision?: "Disetujui" | "Dikembalikan untuk Revisi" | "Ditolak" | "Menunggu Review";
  verifiedImplementationDate?: string;
  /** Display-formatted deadline (48 jam sejak diajukan) by which the reporter must respond before the resolution is auto-accepted. */
  responseDeadline?: string;
  /** Whether reporterDecision was given by the reporter themselves, or auto-applied after responseDeadline passed with no response. Omitted/undefined is treated as "Manual". */
  decisionMethod?: "Manual" | "Otomatis";
}

/** Sasaran catatan internal — siapa yang dimaksudkan membaca/menindaklanjuti (List Revisi 4). */
export type InternalNoteTargetType = "Semua Pihak Tertutup" | "Bursa" | "Kliring" | "Custody" | "Bappebti";

export interface InternalNote {
  author: string;
  role: string;
  institution: string;
  timestamp: string;
  targetType: InternalNoteTargetType;
  /** Specific lembaga name — only set when targetType is Bursa/Kliring/Custody. */
  targetEntity?: string;
  text: string;
  /** Internal notes are never shown to the public or member portals. */
  visibility: "internal";
}

export interface ReporterProfile {
  reporterType?: ReporterType;
  verifiedEmail?: string;
  verifiedPhone?: string;
  province?: string;
  city?: string;
  vulnerableConsumer?: boolean;
  preferredChannel?: "Email" | "WhatsApp" | "SMS" | "Aplikasi";
  consentStatus?: "Diberikan" | "Belum Diberikan";
}

export interface ComplaintCase {
  // --- legacy fields (unchanged, still consumed by existing pages) ---
  ticket: string;
  title: string;
  platform: string;
  bursaEntity: string;
  kliringEntity: string;
  category: string;
  subcategory: string;
  severity: Severity;
  status: CaseStatus;
  currentOwner: OwnerType;
  responsibility: Responsibility;
  slaStatus: SlaStatus;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  amount?: number;
  transactionRef?: string;
  platformUserId?: string;
  chronology: string;
  expectedResolution: string;
  evidences: string[];
  timeline: TimelineEvent[];
  clarifications: ClarificationMessage[];
  reporterName: string;
  reporterCity?: string;
  escalationReason?: string;
  reconciliationIssue?: string;
  resolutionProposal?: string;
  relatedCases?: string[];
  /** Pengaduan (formal complaint) vs Kritik dan Saran (general critique/suggestion). Defaults to "Pengaduan" when omitted. */
  complaintType?: ComplaintType;

  // --- richer regulator-grade model (all optional, additive) ---
  parentIncidentId?: string;
  duplicateOfCase?: string;
  submittedAt?: string;
  closedAt?: string;
  reopenedAt?: string;

  reporter?: ReporterProfile;
  publicStatus?: PublicStatus;
  workflowState?: InternalWorkflowState;
  institution?: InstitutionStructure;
  slaClocks?: SlaClock[];
  resolution?: ResolutionRecord;
  internalNotes?: InternalNote[];

  financialExposure?: number;
  suspectedFraud?: boolean;
  activeSecurityRisk?: boolean;
  illegalEntitySuspected?: boolean;
  massIncident?: boolean;
  priorComplaintToEntity?: boolean;
  priorComplaintDate?: string;
  entityResponse?: string;
  closureReason?: string;
  reopenEligible?: boolean;

  /** Internal Platform CS/staff member (DEMO_USERS name) this ticket is assigned to — distinct from `institution.caseOfficer`, which tracks whichever institution currently owns the case overall. */
  platformPic?: string;
  /** Ecosystem institutions (Bursa/Kliring/Custody) linked to this ticket via the Manajemen Pengaduan "Hubungkan Member" modal — a ticket may be linked to more than one. */
  linkedEcosystemEntities?: LinkedEcosystemEntity[];

  /** Proses penyelesaian perselisihan nasabah PBK (lihat lib/dispute-workflow.ts). */
  dispute?: DisputeRecord;
}

// ---------------------------------------------------------------------------
// Mekanisme Penanganan Perselisihan Nasabah PBK
// Nasabah → pengaduan online + unggah berkas → verifikasi paralel (Bappebti
// materiil & formil 2 HK ∥ klarifikasi Pialang 1 HK) → disposisi ke Pialang →
// Musyawarah (21 HK + perpanjangan maks. 14 hari) → Mediasi Bursa (21 HK +
// perpanjangan maks. 14 hari) → lapor ke Bappebti (1 HK) → kesepakatan
// (dokumen kesepakatan / akta perdamaian) atau Pengadilan/BAKTI.
// ---------------------------------------------------------------------------

export type DisputeStage =
  | "VERIFIKASI"
  | "PERBAIKAN_FORMIL"
  | "DITOLAK_MATERIIL"
  | "MUSYAWARAH"
  | "MEDIASI_BURSA"
  | "LAPOR_HASIL_MEDIASI"
  | "PENYAMPAIAN_KESEPAKATAN"
  | "PILIHAN_PENYELESAIAN"
  | "PENGADILAN_BAKTI"
  | "SELESAI";

export type RequirementResult = "Terpenuhi" | "Tidak Terpenuhi";

export type AgreementDocumentType = "Dokumen Kesepakatan" | "Akta Perdamaian";

export interface DisputeRecord {
  stage: DisputeStage;
  /** Waktu pengaduan online & unggah berkas diterima sistem — awal verifikasi paralel. */
  submittedAt: string;
  bappebtiVerification: {
    materiil?: RequirementResult;
    formil?: RequirementResult;
    verifiedAt?: string;
    verifiedBy?: string;
    note?: string;
  };
  pialangClarification: {
    respondedAt?: string;
    respondedBy?: string;
    /** Hasil klarifikasi Pialang, mis. daluarsa, informasi kontrak, dll. */
    note?: string;
  };
  formilReturnedAt?: string;
  formilCorrectedAt?: string;
  dispositionAt?: string;
  musyawarah?: {
    startedAt: string;
    extendedDays?: number;
    endedAt?: string;
    outcome?: "Tercapai" | "Tidak Tercapai";
  };
  mediasi?: {
    startedAt: string;
    extendedDays?: number;
    endedAt?: string;
    outcome?: "Sepakat" | "Tidak Sepakat";
    reportedAt?: string;
  };
  agreement?: {
    forum: "Musyawarah" | "Mediasi";
    value: number;
    documentType: AgreementDocumentType;
    /** Pihak yang wajib menyampaikan dokumen ke Bappebti: Pialang (musyawarah) atau Bursa (mediasi). */
    submitter: string;
    documentName?: string;
    submittedAt?: string;
  };
  forumChoice?: {
    /** Bursa menjelaskan pilihan sarana penyelesaian; tenggat 20 HK dihitung dari sini. */
    explainedAt: string;
    choice?: "BAKTI" | "Pengadilan";
    chosenAt?: string;
  };
  closedAt?: string;
}

/** One Bursa/Kliring/Custody institution linked to a complaint ticket (List Revisi 4 — Kolom Member). */
export interface LinkedEcosystemEntity {
  /** EcosystemEntity.id. */
  id: string;
  type: "Bursa" | "Kliring" | "Custody";
  name: string;
}

// Tugas Internal — a lightweight task-reminder module scoped to a case,
// shared between the case detail page's "Tugas Internal" tab and the
// Platform portal's "Manajemen Tugas" menu (same underlying store).
export type CaseTaskStatus = "Pending" | "In Progress" | "Done";

/** Who a task is delegated to (List Revisi 4) — "Internal Platform" keeps the task inside the platform's own staff; the other three delegate it to an affiliated ecosystem institution. */
export type TaskDelegationType = "Internal Platform" | "Bursa" | "Kliring" | "Custody";

/** Task urgency (List Revisi 8) — deliberately a 3-level scale distinct from case Severity, since a task reminder never needs "Kritis". */
export type TaskPriority = "Rendah" | "Sedang" | "Tinggi";

export interface CaseTask {
  id: string;
  ticket: string;
  description: string;
  createdBy: string;
  createdByRole: string;
  assignee: string;
  status: CaseTaskStatus;
  document?: string;
  createdAt: string;
  delegationType?: TaskDelegationType;
  /** Specific lembaga name — only set when delegationType is Bursa/Kliring/Custody. */
  delegationEntity?: string;
  priority?: TaskPriority;
  /** Batas Waktu — free-form display date (List Revisi 8), e.g. "20 Jul 2026". */
  dueDate?: string;
}

export interface Member {
  name: string;
  type: string;
  license: string;
  status: string;
  bursa: string;
  kliring: string;
  totalCases: number;
  handled: number;
  unhandled: number;
  slaBreach: number;
  critical: number;
  avgResolution: string;
  slaPercent: number;
  risk: "Rendah" | "Sedang" | "Tinggi";
  category?: string;
  trend?: "naik" | "turun" | "stabil";
  reopenedRate?: number;
  disagreementRate?: number;
  complaintsPer10k?: number;
}

export interface FeedbackItem {
  id: string;
  type: "Kritik" | "Masukan";
  topic: string;
  message: string;
  source: string;
  pic: string;
  status: "Belum Ditugaskan" | "Ditinjau" | "Selesai" | "Dikonversi";
  createdAt: string;
  /** Identity of whoever submitted the feedback, so staff can see what else this person has raised. */
  reporterName: string;
  reporterEmail?: string;
  reporterPhone?: string;
  read?: boolean;
  flagged?: boolean;
  flagReason?: string;
  needsFollowUp?: boolean;
  followUpStatus?: "Proses" | "Selesai";
  followUpNote?: string;
}

export interface AdminUser {
  name: string;
  email: string;
  role: string;
  organization: string;
  status: "Aktif" | "Menunggu Persetujuan" | "Nonaktif";
  lastLogin: string;
}

// ---------------------------------------------------------------------------
// Bab III — unified administration (role builder, approvals, ecosystem
// registration, and app configuration).
// ---------------------------------------------------------------------------

export type ApprovalRequestType =
  | "Pendaftaran Akun Baru"
  | "Perubahan Email"
  | "Reset Password"
  | "Perubahan Role"
  | "Penonaktifan Akun";

export interface ApprovalRequest {
  id: string;
  requestType: ApprovalRequestType;
  targetUserName: string;
  targetUserEmail: string;
  requestedBy: string;
  requestedAt: string;
  /** What specifically is changing, e.g. "Email lama -> email baru". */
  description: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  /** Keys referencing MenuTreeItem.key in lib/menu-tree.ts — at least one required. */
  menuKeys: string[];
  createdAt: string;
  /** Built-in seed roles (used across the rest of the prototype) are not deletable. */
  builtIn?: boolean;
}

/** @deprecated kept only for the pre-wizard seed shape; entities now carry a free-text `category` referencing EcosystemCategoryConfig plus a fixed `ecosystemType`. */
export type EcosystemCategory = "Platform/Pialang" | "Bursa" | "Kliring" | "Asosiasi";

// Ecosystem Type is fixed (only these two values ever exist); Ecosystem
// Category is a manageable list configured in Konfigurasi > Category
// Ecosystem, each category attached to one of these two types.
export type EcosystemType = "Ecosystem Aktif" | "Ecosystem Pengawas";

export interface EcosystemCategoryConfig {
  id: string;
  type: EcosystemType;
  /** Short label, e.g. "Bursa" — shown throughout the UI as the category name. */
  shortDescription: string;
  longDescription: string;
  active: boolean;
  createdAt: string;
  /** "Tanggal tayang" — when this category is/was shown as selectable; free-pick date, independent of createdAt. */
  displayDate: string;
  userMaker: string;
  userApproval?: string;
}

export type EcosystemAccessRole = "Admin Ecosystem" | "Petugas Pengaduan" | "Penyetuju" | "Pemantau";

export interface EcosystemExecutive {
  id: string;
  name: string;
  position: string;
  responsibilityArea: string;
  officialEmail: string;
  phone?: string;
  startDate: string;
  endDate?: string;
  appointmentDocument?: string;
}

export interface EcosystemPic {
  id: string;
  name: string;
  position: string;
  unit: string;
  email: string;
  phone: string;
  accessRole: EcosystemAccessRole;
  isPrimary: boolean;
  appointmentLetter?: string;
}

/** Platform Management's extra governance step — Direksi and Komisaris share this shape. */
export interface PlatformBoardMember {
  id: string;
  name: string;
  birthDate: string;
  idNumber: string;
  /** "Keterangan Lulus Fit and Proper Test". */
  fitProperNote?: string;
}

export interface PlatformMembershipLetter {
  id: string;
  /** Which bursa this membership letter is for; optional since a platform may only belong to one. */
  bursaName?: string;
  file: string;
}

export type EcosystemRegistrationStatus = "Draft" | "Menunggu Verifikasi" | "Perlu Perbaikan" | "Disetujui" | "Ditolak";

export interface EcosystemEntity {
  id: string;
  name: string;
  /** References an EcosystemCategoryConfig.shortDescription. */
  category: string;
  ecosystemType: EcosystemType;
  description?: string;
  shortName?: string;
  logo?: string;
  license?: string;
  npwp?: string;
  aktaPendirian?: string;
  aktaPerubahan?: string;
  pengesahanAhu?: string;
  izinUsaha?: string;
  address?: string;
  province?: string;
  city?: string;
  postalCode?: string;
  officePhone?: string;
  officialEmail?: string;
  website?: string;
  bursa?: string;
  kliring?: string;
  executives?: EcosystemExecutive[];
  pics?: EcosystemPic[];
  // Platform Management governance fields — only populated for entities
  // registered through Platform Management's extended (7-step) wizard.
  administratorEmail?: string;
  administratorName?: string;
  direksi?: PlatformBoardMember[];
  komisaris?: PlatformBoardMember[];
  suratAnggotaBursa?: PlatformMembershipLetter[];
  nibDocument?: string;
  npwpDocument?: string;
  aktaPendirianDocument?: string;
  aktaPerubahanDocument?: string;
  izinUsahaDocument?: string;
  strukturOrganisasiDocument?: string;
  supportingDocuments?: { name: string; file: string }[];
  submitterName?: string;
  submitterPosition?: string;
  status: EcosystemRegistrationStatus;
  hasPendingEdit?: boolean;
  /** Operational on/off switch, independent of the registration status lifecycle. */
  disabled?: boolean;
  establishedAt?: string;
  registeredAt: string;
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
}

export type EcosystemChangeType =
  | "Pendaftaran Baru"
  | "Perubahan Data"
  | "Tambah Kategori"
  | "Nonaktifkan Kategori"
  | "Aktifkan Kategori";

/** Whether an Approval Ekosistem request concerns a registered entity or a category-config change. */
export type EcosystemChangeTarget = "Entitas Ekosistem" | "Kategori Ekosistem";

export interface EcosystemChangeRequest {
  id: string;
  /** Defaults to "Entitas Ekosistem" for pre-existing requests that predate this field. */
  targetType: EcosystemChangeTarget;
  /** EcosystemEntity.id when targetType is "Entitas Ekosistem", EcosystemCategoryConfig.id otherwise. */
  entityId: string;
  changeType: EcosystemChangeType;
  entityName: string;
  before?: Partial<EcosystemEntity> | Partial<EcosystemCategoryConfig>;
  after: EcosystemEntity | EcosystemCategoryConfig;
  requestedBy: string;
  requestedAt: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
}

// Management Member (List Revisi 3, corrected by List Revisi 4) — the
// Bappebti-curated relationship between a Platform/Pialang and the
// ecosystem institution (Bursa/Kliring/Custody) it is a registered member
// of. The "member" is always the PLATFORM here, never the institution
// itself: /platform/member (List Revisi 4 #1) reads this filtered to the
// logged-in platform, and /ekosistem/active/member (List Revisi 4 #5B)
// reads it filtered to whichever institution is the active role-switcher
// context — both directions of the same relationship.
export type PlatformMembershipEcosystemType = "Bursa" | "Kliring" | "Custody";
export type PlatformMembershipStatus = "Aktif" | "Suspended" | "Non-Aktif";

export interface PlatformEcosystemMembership {
  /** Kode Keanggotaan, e.g. "MBR-PL-099". */
  id: string;
  /** EcosystemEntity.id of the platform (category === "Platform/Pialang"). */
  platformEntityId: string;
  platformName: string;
  ecosystemType: PlatformMembershipEcosystemType;
  /** EcosystemEntity.id of the Bursa/Kliring/Custody institution. */
  ecosystemEntityId: string;
  ecosystemEntityName: string;
  registeredAt: string;
  /** The platform's own PIC/contact for this membership — shown from the institution's side (List Revisi 4 #5B "PIC Platform & Kontak Aduan"). */
  picName: string;
  picContact: string;
  status: PlatformMembershipStatus;
  createdBy: string;
  createdAt: string;
}

export type EcosystemAssociation = "ASPEBTINDO" | "BAKTI";
export type PelakuUsahaCategory = "Pialang Berjangka" | "CPFAK / PFAK" | "Platform";
export type EcosystemPengawasMembershipStatus = "Aktif" | "Suspended" | "Non-Aktif";

export interface EcosystemPengawasMember {
  /** Kode Anggota, e.g. "ASP-PL-045" or "BAKTI-MBR-012". */
  id: string;
  /** EcosystemEntity.id of the pelaku usaha (Platform Management master data). */
  sourceEntityId: string;
  association: EcosystemAssociation;
  companyName: string;
  category: PelakuUsahaCategory;
  license: string;
  joinedAt: string;
  picName: string;
  picContact: string;
  status: EcosystemPengawasMembershipStatus;
  createdBy: string;
  createdAt: string;
}

// Routing Mapping — maps each registered Platform/Pialang entity to the
// registered institution that handles it for every other active
// "Ecosystem Aktif" category (Bursa, Kliring, Custody, ...). Column set is
// derived at render time from EcosystemCategoryConfig, so this stays a
// plain dictionary rather than fixed bursa/kliring fields.
export interface RoutingMapping {
  platformId: string;
  platformName: string;
  /** Keyed by EcosystemCategoryConfig.shortDescription, value is the mapped EcosystemEntity.id (or "" if unset). */
  mappings: Record<string, string>;
  updatedAt?: string;
  updatedBy?: string;
}

export interface RoutingChangeRequest {
  id: string;
  platformId: string;
  platformName: string;
  /** Category shortDescription -> mapped EcosystemEntity.id (empty string if unset); same shape as RoutingMapping.mappings. */
  before: Record<string, string>;
  after: Record<string, string>;
  requestedBy: string;
  requestedAt: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
}

export type ConfigType = "Kategori Pengaduan" | "Manajemen SLA" | "Kategori Ekosistem";
export type ConfigChangeAction = "Tambah" | "Nonaktifkan" | "Aktifkan" | "Ubah";

export interface ConfigChangeRequest {
  id: string;
  configType: ConfigType;
  action: ConfigChangeAction;
  itemLabel: string;
  beforeValue?: string;
  afterValue: string;
  /** JSON-encoded payload needed to apply the change once approved. */
  payload: string;
  requestedBy: string;
  requestedAt: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  decidedBy?: string;
  decidedAt?: string;
  reason?: string;
}

export interface ComplaintCategoryConfig {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface SlaConfigEntry {
  id: string;
  hours: number;
  effectiveFrom: string;
  changedBy: string;
  note?: string;
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  object: string;
  before: string;
  after: string;
  reason?: string;
  visibility?: "public" | "internal";
}

export interface NotificationItem {
  time: string;
  ticket: string;
  type: string;
  message: string;
  status: "Belum Dibaca" | "Dibaca";
  priority?: "Membutuhkan Tindakan" | "Penting" | "Informasional";
}

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  leadInstitution: string;
  affectedEntities: string[];
  relatedCaseCount: number;
  estimatedConsumersAffected: number;
  estimatedFinancialExposure: number;
  rootCause?: string;
  severity: Severity;
  status: "Aktif" | "Cluster Muncul" | "Selesai";
  commandOwner: string;
  publicCommunicationStatus: "Belum Ada" | "Disiapkan" | "Dipublikasikan";
  correctiveActions?: string;
  preventiveActions?: string;
  startDate: string;
  resolutionDate?: string;
  relatedCases: string[];
}

// ---------------------------------------------------------------------------
// Clarification module — a clarification is a distinct business object with
// its own ID (a case can contain multiple clarifications), separate from the
// generic ComplaintCase.clarifications message array used by older pages.
// ---------------------------------------------------------------------------

export type ClarificationStatus =
  | "DRAFT"
  | "SENT"
  | "WAITING_RESPONSE"
  | "PARTIALLY_RESPONDED"
  | "RESPONDED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type ClarificationPartyType = "REPORTER" | "PLATFORM" | "BURSA" | "CLEARING" | "BAPPEBTI";

export type ClarificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ClarificationParty {
  partyType: ClarificationPartyType;
  institutionId?: string;
  institutionName: string;
  userId?: string;
  userName?: string;
  roleLabel: string;
}

export interface ClarificationAttachment {
  id: string;
  filename: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  sizeLabel?: string;
}

export type ClarificationEventVisibility = "public" | "member" | "internal";

export interface ClarificationHistoryEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  institution: string;
  action: string;
  note?: string;
  visibility: ClarificationEventVisibility;
  beforeState?: ClarificationStatus;
  afterState?: ClarificationStatus;
  reason?: string;
}

export interface RequestedInformationItem {
  label: string;
  status: "Belum Diberikan" | "Sudah Diberikan" | "Perlu Diperbaiki" | "Diterima";
}

export interface ClarificationRequest {
  id: string;
  caseTicket: string;
  requestDirection: "INCOMING" | "OUTGOING";
  requestedBy: ClarificationParty;
  requestedFrom: ClarificationParty;
  subject: string;
  question: string;
  reason: string;
  requestedInformation?: RequestedInformationItem[];
  requestedEvidenceTypes?: string[];
  requestedFields?: string[];
  priority: ClarificationPriority;
  createdAt: string;
  dueAt: string;
  originalDueAt?: string;
  respondedAt?: string;
  completedAt?: string;
  breachedAt?: string;
  status: ClarificationStatus;
  responseDraft?: string;
  formalResponse?: {
    summary: string;
    detailedExplanation: string;
    referencedTransaction?: string;
    factsConfirmed?: string;
    factsNotConfirmed?: string;
    respondingOfficer: string;
    supervisorApproval?: string;
    submittedAt: string;
  };
  reviewerComments?: string;
  revisionReason?: string;
  requiredCorrections?: string;
  attachments: ClarificationAttachment[];
  responseAttachments: ClarificationAttachment[];
  history: ClarificationHistoryEvent[];
  internalNote?: string;
  visibility: {
    publicReporter: boolean;
    platform: boolean;
    bursa: boolean;
    clearing: boolean;
    bappebti: boolean;
  };
}

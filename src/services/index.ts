/**
 * Services Index
 * Centralized export of all business logic services
 */

export { entriesService, EntriesService } from './entries.service'
export { sharingService, SharingService } from './sharing.service'
export { authService, AuthService } from './auth.service'

// Re-export types
export type {
  EntriesListParams,
  EntriesListResult,
  CreateShareData,
  ShareFilters,
  SharedEntry,
  RegisterData,
  LoginData
} from './entries.service'
export type { CreateShareData as CreateShareDataType } from './sharing.service'

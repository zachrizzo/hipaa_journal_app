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
  EntriesListResult
} from './entries.service'
export type {
  RegisterData,
  LoginData,
  LoginResponse
} from './auth.service'
export type { 
  CreateShareData,
  ShareFilters,
  SharedEntry
} from './sharing.service'

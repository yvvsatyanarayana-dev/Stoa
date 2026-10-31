export interface UserAccount {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  provider: 'local' | 'google'
  initials: string
  createdAt: string
  activeWorkspaceId?: string
}

export interface AuthState {
  currentUser: UserAccount | null
  isAuthenticated: boolean
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
  loginWithGoogle: (email?: string, name?: string, avatarUrl?: string, workspaceName?: string) => void
  registerAccount: (name: string, email: string, password?: string, workspaceName?: string, role?: string) => void
  loginWithCredentials: (email: string, password?: string) => boolean
  updateProfile: (partial: Partial<UserAccount>) => void
  logout: () => void
}

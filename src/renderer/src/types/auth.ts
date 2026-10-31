export interface UserAccount {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  provider: 'local' | 'google'
  initials: string
  createdAt: string
}

export interface AuthState {
  currentUser: UserAccount
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
  loginWithGoogle: (email?: string, name?: string, avatarUrl?: string) => void
  registerAccount: (name: string, email: string, role?: string) => void
  updateProfile: (partial: Partial<UserAccount>) => void
  logout: () => void
}

import { create } from 'zustand'

interface NavigationState {
  isNavigating: boolean
  targetPath: string | null
  startNavigation: (path: string) => void
  endNavigation: () => void
}

export const useNavigation = create<NavigationState>((set) => ({
  isNavigating: false,
  targetPath: null,
  startNavigation: (path: string) => set({ isNavigating: true, targetPath: path }),
  endNavigation: () => set({ isNavigating: false, targetPath: null }),
}))

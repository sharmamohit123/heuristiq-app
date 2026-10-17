import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isCollapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: 'heuristiq-sidebar-state',
    }
  )
)

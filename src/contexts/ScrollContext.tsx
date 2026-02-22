import { createContext, useContext } from 'react'

export const ScrollContext = createContext<React.RefObject<HTMLDivElement | null>>({ current: null } as React.RefObject<HTMLDivElement | null>)

export function useScrollContainer() {
  return useContext(ScrollContext)
}

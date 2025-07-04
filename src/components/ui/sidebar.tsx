"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void;
  openMobile: boolean // This is specifically for the Sheet component on mobile
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(
  (
    { children, ...props },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [open, setOpen] = React.useState(false)
    const [openMobile, setOpenMobile] = React.useState(false)

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((current) => !current)
        : setOpen((current) => !current)
    }, [isMobile])

    // Keyboard shortcut is removed as sidebar is now hover-based.
    // React.useEffect(() => {
    //   const handleKeyDown = (event: KeyboardEvent) => {
    //     if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
    //       event.preventDefault()
    //       toggleSidebar()
    //     }
    //   }
    //   window.addEventListener("keydown", handleKeyDown)
    //   return () => window.removeEventListener("keydown", handleKeyDown)
    // }, [toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, isMobile, openMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div ref={ref} {...props}>{children}</div>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"


export {
  SidebarProvider,
  useSidebar,
}

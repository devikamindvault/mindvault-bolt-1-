
import { useContext } from "react"

import type { ToasterToast } from "./toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

export function useToast() {
  return {
    toast: (props: ToasterToast) => {},
    dismiss: (toastId?: string) => {},
    toasts: [] as ToasterToast[],
  }
}

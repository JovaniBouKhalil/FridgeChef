import { createContext, useContext } from 'react'

export const KitchenContext = createContext(null)
export const useKitchen = () => useContext(KitchenContext)

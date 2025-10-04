import { createContext, useContext } from 'react'

const WidgetContext = createContext()

export const useWidgets = () => {
  const context = useContext(WidgetContext)
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetProvider')
  }
  return context
}

export const WidgetProvider = ({ children, value }) => {
  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  )
}
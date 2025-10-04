import { useSettings } from '../contexts/SettingsContext'

const Greeting = () => {
  const { settings } = useSettings()
  const hour = new Date().getHours()
  
  let greeting = 'Welcome back'
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 17) greeting = 'Good afternoon'
  else greeting = 'Good evening'
  
  if (settings.userName) {
    greeting += `, ${settings.userName}`
  }
  
  return (
    <div className="greeting" data-testid="greeting">
      {greeting}!
    </div>
  )
}

export default Greeting
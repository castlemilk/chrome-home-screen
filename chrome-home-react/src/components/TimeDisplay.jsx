import { useState, useEffect } from 'react'

const TimeDisplay = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours().toString().padStart(2, '0')
  const minutes = time.getMinutes().toString().padStart(2, '0')

  return (
    <div className="time-display" data-testid="time-display">
      {hours}:{minutes}
    </div>
  )
}

export default TimeDisplay
const CalendarWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  if (isConfigMode) {
    return <div className="widget-config-content">Calendar Settings</div>
  }
  return <div className="widget-content">Calendar Widget</div>
}

export default CalendarWidget
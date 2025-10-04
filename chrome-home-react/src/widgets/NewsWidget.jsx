const NewsWidget = ({ config, onConfigUpdate, isConfigMode }) => {
  if (isConfigMode) {
    return <div className="widget-config-content">News Settings</div>
  }
  return <div className="widget-content">News Widget</div>
}

export default NewsWidget
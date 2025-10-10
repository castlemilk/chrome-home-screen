import { useState } from 'react'

const GoogleAppsWidget = ({ isConfigMode }) => {
  const [hoveredApp, setHoveredApp] = useState(null)

  // Google apps with their icons and URLs
  const googleApps = [
    { 
      name: 'Account', 
      url: 'https://myaccount.google.com/',
      icon: 'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png',
      bgColor: '#4285f4'
    },
    { 
      name: 'Drive', 
      url: 'https://drive.google.com/',
      icon: 'https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png',
      bgColor: '#0f9d58'
    },
    { 
      name: 'Gmail', 
      url: 'https://mail.google.com/',
      icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r5.png',
      bgColor: '#ea4335'
    },
    { 
      name: 'YouTube', 
      url: 'https://youtube.com/',
      icon: 'https://www.youtube.com/s/desktop/6e27a787/img/favicon_144x144.png',
      bgColor: '#ff0000'
    },
    { 
      name: 'Gemini', 
      url: 'https://gemini.google.com/',
      icon: 'https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg',
      bgColor: '#886FBF'
    },
    { 
      name: 'Maps', 
      url: 'https://maps.google.com/',
      icon: 'https://www.google.com/images/branding/product/2x/maps_96in128dp.png',
      bgColor: '#1a73e8'
    },
    { 
      name: 'Search', 
      url: 'https://www.google.com/',
      icon: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png',
      bgColor: '#4285f4'
    },
    { 
      name: 'Calendar', 
      url: 'https://calendar.google.com/',
      icon: 'https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_31.ico',
      bgColor: '#1a73e8'
    },
    { 
      name: 'Photos', 
      url: 'https://photos.google.com/',
      icon: 'https://www.gstatic.com/images/branding/product/1x/photos_48dp.png',
      bgColor: '#fbbc04'
    },
    { 
      name: 'Meet', 
      url: 'https://meet.google.com/',
      icon: 'https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-96dp/logo_meet_2020q4_color_2x_web_96dp.png',
      bgColor: '#00832d'
    },
    { 
      name: 'Docs', 
      url: 'https://docs.google.com/',
      icon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
      bgColor: '#4285f4'
    },
    { 
      name: 'Sheets', 
      url: 'https://sheets.google.com/',
      icon: 'https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico',
      bgColor: '#0f9d58'
    },
    { 
      name: 'Slides', 
      url: 'https://slides.google.com/',
      icon: 'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico',
      bgColor: '#f4b400'
    },
    { 
      name: 'Keep', 
      url: 'https://keep.google.com/',
      icon: 'https://www.gstatic.com/images/branding/product/1x/keep_2020q4_48dp.png',
      bgColor: '#fbbc04'
    },
    { 
      name: 'Translate', 
      url: 'https://translate.google.com/',
      icon: 'https://ssl.gstatic.com/translate/favicon.ico',
      bgColor: '#4285f4'
    },
    { 
      name: 'Contacts', 
      url: 'https://contacts.google.com/',
      icon: 'https://ssl.gstatic.com/contacts/images/favicon.ico',
      bgColor: '#1a73e8'
    }
  ]

  const openApp = (url) => {
    window.open(url, '_blank')
  }

  if (isConfigMode) {
    return (
      <div className="widget-config-content">
        <h3>Google Apps Settings</h3>
        <p>Quick access to your favorite Google services.</p>
        <div className="config-help">
          Click any app icon to open it in a new tab.
        </div>
      </div>
    )
  }

  return (
    <div className="google-apps-widget">
      <div className="google-apps-grid">
        {googleApps.map((app, index) => (
          <div
            key={index}
            className={`google-app-item ${hoveredApp === index ? 'hovered' : ''}`}
            onClick={() => openApp(app.url)}
            onMouseEnter={() => setHoveredApp(index)}
            onMouseLeave={() => setHoveredApp(null)}
          >
            <div className="google-app-icon">
              <img src={app.icon} alt={app.name} />
            </div>
            <div className="google-app-name">{app.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GoogleAppsWidget


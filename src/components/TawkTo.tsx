import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    Tawk_API?: any
    Tawk_LoadStart?: Date
  }
}

export function TawkTo() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    window.Tawk_API.customStyle = {
      bubble: {
        background: '#1B3A5C',
        color: '#FFFFFF',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      },
      header: {
        background: '#1B3A5C',
        color: '#FFFFFF',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      },
      chat: {
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      },
    }

    window.Tawk_API.onLoad = function () {
      try {
        window.Tawk_API?.setAttributes?.(
          {
            name: 'GlobalSend User',
            email: 'support@globalsend.com',
          },
          function () {}
        )
        window.Tawk_API?.maximizeWidget?.()
        window.Tawk_API?.minimizeWidget?.()
      } catch {}
    }
    window.Tawk_API.onOffline = function () {
      window.Tawk_API?.setAttributes?.(
        {
          name: 'GlobalSend User',
          email: 'support@globalsend.com',
        },
        function () {}
      )
    }

    const s1 = document.createElement('script')
    s1.async = true
    s1.src = 'https://embed.tawk.to/6a464e249310bd1d4ef8c3cf/1jsha2g3a'
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    document.head.appendChild(s1)

    const style = document.createElement('style')
    style.textContent = `
      .tawk-min-container .tawk-button {
        background: #1B3A5C !important;
        box-shadow: 0 4px 12px rgba(27,58,92,0.3) !important;
        border-radius: 50% !important;
      }
      .tawk-min-container .tawk-button:hover {
        background: #2C5282 !important;
        box-shadow: 0 6px 16px rgba(27,58,92,0.4) !important;
      }
      .tawk-header {
        background: linear-gradient(135deg, #1B3A5C 0%, #2C5282 100%) !important;
      }
      .tawk-header .tawk-title {
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      }
      .tawk-header .tawk-subtitle {
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      }
      .tawk-visitor-message {
        background: #E8EDF3 !important;
        color: #1a1a2e !important;
      }
      .tawk-agent-message {
        background: #1B3A5C !important;
        color: #ffffff !important;
      }
      .tawk-send-button {
        background: #1B3A5C !important;
      }
      .tawk-send-button:hover {
        background: #2C5282 !important;
      }
      .tawk-agent-name {
        color: #1B3A5C !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      const widget = document.getElementById('tawkto-widget')
      if (widget) widget.remove()
      const script = document.querySelector('script[src*="tawk.to"]')
      if (script) script.remove()
      style.remove()
    }
  }, [])

  return null
}

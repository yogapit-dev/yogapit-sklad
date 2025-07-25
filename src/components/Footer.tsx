import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ 
      backgroundColor: 'black',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(30,41,59,0.8))',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Cosmic Background Elements */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{ width: '100%', padding: '64px 16px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', marginBottom: '48px', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Left Column - Reinkarnácia Blog Information */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <img
                src="https://reinkarnacia.sk/engine/wp-content/themes/reinkarnacia/assets/images/logo.png"
                alt="Reinkarnácia Shop Logo"
                style={{
                  height: '40px',
                  width: 'auto',
                  filter: 'brightness(0) invert(1)', // Makes the logo white
                  marginRight: '12px'
                }}
              />
              <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '600' }}>
                Oficiálny blog Reinkarnácia.
              </h3>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
              Pre informácie o pravidelných programoch a prednáškach kontaktujte priamo konkrétne centrum vo Vašom okolí.
            </p>
            <p style={{ color: '#8b5cf6', fontSize: '14px' }}>
              e-mail: info@reinkarnacia.sk
            </p>
          </div>

          {/* Middle Column - Business Information */}
          <div>
            <h4 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Obchodné informácie
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Kontakt',
                'Doprava a platba', 
                'Ochrana osobných údajov',
                'Obchodné podmienky',
                'Reklamácia, vrátenie tovaru',
                'F.A.Q'
              ].map((item, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={{ 
                      color: '#9ca3af', 
                      textDecoration: 'none', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                  >
                    <span style={{ 
                      width: '0', 
                      height: '0', 
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: '6px solid #9ca3af',
                      marginRight: '8px'
                    }}></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Useful Links */}
          <div>
            <h4 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Užitočné odkazy
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Bhagavad-Gíta',
                'Śrímad Bhagavatam',
                'Askfm - Narayan Das',
                'NaraDesign'
              ].map((item, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <a 
                    href="#" 
                    style={{ 
                      color: '#9ca3af', 
                      textDecoration: 'none', 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.2s'
                    }}
                  >
                    <span style={{ 
                      width: '0', 
                      height: '0', 
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: '6px solid #9ca3af',
                      marginRight: '8px'
                    }}></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Media Section */}
        <div style={{ 
          borderTop: '1px solid #374151', 
          paddingTop: '32px', 
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              Sledujte nás na:
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* Facebook */}
              <a href="#" style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#374151', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>f</span>
              </a>
              
              {/* Instagram */}
              <a href="#" style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#374151', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}>
                <span style={{ fontSize: '18px' }}>📷</span>
              </a>
              
              {/* YouTube */}
              <a href="#" style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#374151', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}>
                <span style={{ fontSize: '18px' }}>▶️</span>
              </a>
              
              {/* RSS */}
              <a href="#" style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#374151', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}>
                <span style={{ fontSize: '16px' }}>📡</span>
              </a>
            </div>
          </div>

          {/* GDPR Notice */}
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
              Táto stránka používa cookies pre lepší zážitok.
            </p>
            <a 
              href="https://reinkarnacia.sk/gdpr/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#8b5cf6', 
                textDecoration: 'none', 
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              Ochrana osobných údajov (GDPR)
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{ 
          borderTop: '1px solid #374151', 
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
              Made by love
            </span>
            <span style={{ color: '#ec4899', fontSize: '16px' }}>∞</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px' }}>
              © 2011-2024 Reinkarnacia.sk
            </p>
            
            {/* Admin Link - nenápadná ikona */}
            <a 
              href="/admin" 
              style={{ 
                color: '#6b7280', 
                textDecoration: 'none',
                transition: 'color 0.2s',
                opacity: '0.6',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Admin"
            >
              <Settings size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 
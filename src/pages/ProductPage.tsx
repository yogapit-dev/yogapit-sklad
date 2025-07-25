import { useParams } from 'react-router-dom'

export default function ProductPage() {
  const { id } = useParams()

  return (
    <div style={{ padding: '64px 16px', backgroundColor: '#111827' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', fontSize: '48px', fontWeight: '600', marginBottom: '32px' }}>
          Produkt ID: {id}
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '18px' }}>
          Tu bude detail produktu s ID {id}
        </p>
      </div>
    </div>
  )
} 
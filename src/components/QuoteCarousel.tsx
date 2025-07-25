import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface Quote {
  id: number
  text: string
  source: string
  link?: string
}

interface QuoteCarouselProps {
  quotes: Quote[]
}

export default function QuoteCarousel({ quotes }: QuoteCarouselProps) {
  const swiperRef = useRef<any>(null)

  return (
    <section style={{
      padding: '80px 16px',
      backgroundColor: 'black',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Purple Shapes */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', width: '100px', height: '60px', backgroundColor: 'rgba(139, 92, 246, 0.3)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', width: '120px', height: '80px', backgroundColor: 'rgba(139, 92, 246, 0.3)', borderRadius: '50%', filter: 'blur(20px)' }}></div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          modules={[Navigation, Pagination]}
          spaceBetween={64}
          slidesPerView={1}
          loop={true}
          pagination={{
            clickable: true,
            el: '.quote-pagination',
          }}
          style={{ paddingBottom: '40px' }}
        >
          {quotes.map((quote) => (
            <SwiperSlide key={quote.id}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
                {/* Left Side - Quote */}
                <div style={{ position: 'relative' }}>
                  {/* Large Quote Mark Background */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    fontSize: '120px',
                    color: 'rgba(156, 163, 175, 0.1)',
                    fontFamily: 'serif',
                    zIndex: 0
                  }}>
                    "
                  </div>

                  {/* Quote Content */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <blockquote style={{
                      color: 'white',
                      fontSize: '20px',
                      lineHeight: '1.6',
                      marginBottom: '24px',
                      fontStyle: 'italic'
                    }}>
                      {quote.text}
                    </blockquote>

                    <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '12px' }}>
                      {quote.source}
                    </p>

                    {quote.link && (
                      <a href={quote.link} style={{
                        color: '#8b5cf6',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        (prejsť do citátu...)
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Side - Candle Image */}
                <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Candle Placeholder */}
                  <div style={{
                    width: '200px',
                    height: '300px',
                    backgroundColor: '#374151',
                    borderRadius: '20px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {/* Candle Bowl */}
                    <div style={{
                      width: '120px',
                      height: '80px',
                      backgroundColor: '#8b4513',
                      borderRadius: '50% 50% 0 0',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Candle */}
                      <div style={{
                        width: '20px',
                        height: '60px',
                        backgroundColor: '#1f2937',
                        borderRadius: '4px',
                        position: 'relative'
                      }}>
                        {/* Candle Flame */}
                        <div style={{
                          position: 'absolute',
                          top: '-15px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '0',
                          height: '0',
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderBottom: '20px solid #fbbf24',
                          filter: 'blur(1px)'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Buttons */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '0', 
          right: '0', 
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 10
        }}>
          <button 
            onClick={() => swiperRef.current?.slidePrev()}
            style={{
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              transition: 'all 0.2s'
            }}
          >
            ←
          </button>
          <button 
            onClick={() => swiperRef.current?.slideNext()}
            style={{
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              transition: 'all 0.2s'
            }}
          >
            →
          </button>
        </div>

        {/* Custom Pagination */}
        <div className="quote-pagination" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px',
          marginTop: '40px'
        }}></div>
      </div>
    </section>
  )
} 
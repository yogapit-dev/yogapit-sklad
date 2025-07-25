import { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface ProductCarouselProps {
  title: string
  products: Array<{
    id: number
    name: string
    price: string
    tag?: string
    tagColor?: string
  }>
}

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
  const swiperRef = useRef<any>(null)

  return (
    <section style={{ padding: '64px 16px', backgroundColor: 'black' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
          <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '600' }}>{title}</h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => swiperRef.current?.slidePrev()}
              style={{ 
                color: 'white', 
                background: 'none', 
                border: '1px solid #374151', 
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => swiperRef.current?.slideNext()}
              style={{ 
                color: 'white', 
                background: 'none', 
                border: '1px solid #374151', 
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Swiper Carousel */}
        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper
          }}
          modules={[Navigation, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 4,
            },
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
          }}
          style={{ paddingBottom: '40px' }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <div style={{ backgroundColor: '#111827', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                {/* Product Image */}
                <div style={{ position: 'relative', height: '200px', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Tag */}
                  {product.tag && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      left: '12px', 
                      backgroundColor: product.tagColor || '#f97316', 
                      color: 'white', 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      padding: '4px 8px', 
                      borderRadius: '4px' 
                    }}>
                      {product.tag}
                    </div>
                  )}

                  {/* Buddha Statue Placeholder */}
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: '#fbbf24', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <span style={{ fontSize: '32px' }}>🧘</span>
                  </div>

                  {/* Cart Icon Overlay */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '12px', 
                    right: '12px', 
                    width: '32px', 
                    height: '32px', 
                    backgroundColor: '#374151', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                    {product.name}
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>Skladom</p>
                  <p style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>{product.price}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Pagination */}
        <div className="swiper-pagination" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px',
          marginTop: '20px'
        }}></div>
      </div>
    </section>
  )
} 
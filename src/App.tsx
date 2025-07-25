import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import AdminPage from './pages/AdminPage'

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <>
      {/* Header Navigation - nezobrazuje sa na admin stránke */}
      {!isAdminPage && <Header />}
      
      <div className={`${isAdminPage ? 'h-screen' : 'min-h-screen'} bg-gray-900`}>
        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/objednavka" element={<CartPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>

        {/* Footer - nezobrazuje sa na admin stránke */}
        {!isAdminPage && <Footer />}
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App

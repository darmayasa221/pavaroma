import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import WhatsAppFAB from './components/ui/WhatsAppFAB'
import LangToggle from './components/ui/LangToggle'
import { LangProvider } from './contexts/LangContext'

// Split out so supabase-js, the order form and the reviews never load for the
// landing page — which is all most visitors ever see.
const ProductDetail = lazy(() => import('./pages/ProductDetail'))

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        {/* Persist across routes so the language choice and the WhatsApp
            shortcut are always reachable, including on a product page. */}
        <LangToggle />
        <WhatsAppFAB />
        <Suspense fallback={<div className="h-dvh bg-bg" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LangProvider>
  )
}

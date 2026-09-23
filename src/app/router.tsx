import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { EditorPage } from '@/pages/editor-page'
import { HomePage } from '@/pages/home-page'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

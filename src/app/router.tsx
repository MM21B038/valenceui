import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { EditorPage } from '@/pages/editor-page'
import { HomePage } from '@/pages/home-page'
import { PromptsPage } from '@/pages/prompts-page'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

import { Route, Routes } from 'react-router'
import { RequireAccess } from '@/auth/RequireAccess'
import { ComingSoon } from '@/pages/ComingSoon'
import { DashboardPage } from '@/pages/Dashboard'
import { GovernmentPage } from '@/pages/Government'
import { LoginPage } from '@/pages/LoginPage'
import { QuizPreviewPage } from '@/pages/QuizPreviewPage'
import { WorldMapPage } from '@/pages/WorldMapPage'
import { AppShell } from '@/ui/AppShell'

export function App() {
  return (
    <Routes>
      <Route element={<RequireAccess />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="mapa" element={<WorldMapPage />} />
          <Route path="governo" element={<GovernmentPage />} />
          <Route path="teste-quiz" element={<QuizPreviewPage />} />
        </Route>
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route
        path="criar-pais"
        element={
          <ComingSoon
            title="Fundação de nação"
            text="O assistente de fundação em 12 etapas chega na Fase 2."
          />
        }
      />
      <Route
        path="*"
        element={
          <ComingSoon title="Página não encontrada" text="Esse endereço não existe no GeoRPG." />
        }
      />
    </Routes>
  )
}

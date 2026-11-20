import { Route, Routes } from 'react-router'
import { RequireAccess } from '@/auth/RequireAccess'
import { RequireNation } from '@/auth/RequireNation'
import { FoundNationPage } from '@/pages/FoundNationPage'
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
        {/* Revalida a posse ao alternar entre fundação e jogo, inclusive após confirmar. */}
        <Route path="criar-pais" element={<RequireNation key="founding" mode="founding" />}>
          <Route index element={<FoundNationPage />} />
        </Route>
        <Route element={<RequireNation key="game" mode="game" />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="mapa" element={<WorldMapPage />} />
            <Route path="governo" element={<GovernmentPage />} />
            <Route path="teste-quiz" element={<QuizPreviewPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <ComingSoon title="Página não encontrada" text="Esse endereço não existe no GeoRPG." />
        }
      />
    </Routes>
  )
}

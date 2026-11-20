import { Route, Routes } from 'react-router'
import type { ComponentType } from 'react'
import { RequireAccess } from '@/auth/RequireAccess'
import { RequireNation } from '@/auth/RequireNation'
import { NAV_ITEMS, type NavId } from '@/domain/nav'
import { FoundNationPage } from '@/pages/FoundNationPage'
import { ComingSoon } from '@/pages/ComingSoon'
import { DashboardPage } from '@/pages/Dashboard'
import { DiplomacyPage } from '@/pages/Diplomacy'
import { EconomyPage } from '@/pages/Economy'
import { GovernmentPage } from '@/pages/Government'
import { LoginPage } from '@/pages/LoginPage'
import { NationalHistoryPage } from '@/pages/NationalHistory'
import { PressPage } from '@/pages/Press'
import { QuizPreviewPage } from '@/pages/QuizPreviewPage'
import { InfrastructurePage, MilitaryPage, TechnologyPage } from '@/pages/SectorPages'
import { SocietyPage } from '@/pages/Society'
import { WorldMapPage } from '@/pages/WorldMapPage'
import { AppShell } from '@/ui/AppShell'

const pages: Record<NavId, ComponentType> = {
  overview: DashboardPage,
  map: WorldMapPage,
  history: NationalHistoryPage,
  government: GovernmentPage,
  economy: EconomyPage,
  society: SocietyPage,
  infrastructure: InfrastructurePage,
  military: MilitaryPage,
  technology: TechnologyPage,
  diplomacy: DiplomacyPage,
  press: PressPage,
}

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
            {NAV_ITEMS.map(({ id, path }) => {
              const Page = pages[id]
              return path === '/' ? (
                <Route key={id} index element={<Page />} />
              ) : (
                <Route key={id} path={path} element={<Page />} />
              )
            })}
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

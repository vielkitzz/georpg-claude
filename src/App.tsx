import type { ComponentType } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { RequireAccess } from '@/auth/RequireAccess'
import { RequireNation } from '@/auth/RequireNation'
import { LEGACY_ROUTES, NAV_ITEMS, type NavId } from '@/domain/nav'
import { ComingSoon } from '@/pages/ComingSoon'
import { DashboardPage } from '@/pages/Dashboard'
import { DiplomacyPage } from '@/pages/Diplomacy'
import { EconomyPage } from '@/pages/Economy'
import { FoundNationPage } from '@/pages/FoundNationPage'
import { GovernmentPage } from '@/pages/Government'
import { IndicatorsPage } from '@/pages/Indicators'
import { LoginPage } from '@/pages/LoginPage'
import { NationalHistoryPage } from '@/pages/NationalHistory'
import { QuizPreviewPage } from '@/pages/QuizPreviewPage'
import { SectionDetailPage } from '@/pages/SectionDetails'
import { DefensePage, InfrastructurePage } from '@/pages/SectorPages'
import { SocietyPage } from '@/pages/Society'
import { WorldMapPage } from '@/pages/WorldMapPage'
import { AppShell } from '@/ui/AppShell'

const pages: Record<NavId, ComponentType> = {
  nation: DashboardPage,
  map: WorldMapPage,
  indicators: IndicatorsPage,
  government: GovernmentPage,
  economy: EconomyPage,
  society: SocietyPage,
  infrastructure: InfrastructurePage,
  diplomacy: DiplomacyPage,
  defense: DefensePage,
  history: NationalHistoryPage,
}

function GameRedirect({ pathname }: { pathname: string }) {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname, search, hash }} replace />
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
          <Route index element={<GameRedirect pathname="/nacao" />} />
          {Object.entries(LEGACY_ROUTES).map(([from, to]) => (
            <Route key={from} path={from} element={<GameRedirect pathname={to} />} />
          ))}
          <Route element={<AppShell />}>
            {NAV_ITEMS.map(({ id, path, children }) => {
              const Page = pages[id]
              return (
                <Route key={id} path={path}>
                  <Route index element={<Page />} />
                  {children?.map((page) => (
                    <Route
                      key={page.id}
                      path={page.id}
                      element={<SectionDetailPage page={page} />}
                    />
                  ))}
                </Route>
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

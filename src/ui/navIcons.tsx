import {
  Coins,
  FlaskConical,
  Handshake,
  Landmark,
  LayoutDashboard,
  Map as MapIcon,
  Newspaper,
  ScrollText,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { NavItem } from '@/domain/nav'

export const NAV_ICONS: Record<NavItem['icon'], LucideIcon> = {
  overview: LayoutDashboard,
  map: MapIcon,
  government: Landmark,
  economy: Coins,
  society: Users,
  diplomacy: Handshake,
  military: Shield,
  press: Newspaper,
  technology: FlaskConical,
  history: ScrollText,
}

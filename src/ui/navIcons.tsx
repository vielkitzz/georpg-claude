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
  TrainFront,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { NavId } from '@/domain/nav'

export const NAV_ICONS: Record<NavId, LucideIcon> = {
  overview: LayoutDashboard,
  map: MapIcon,
  government: Landmark,
  economy: Coins,
  society: Users,
  infrastructure: TrainFront,
  diplomacy: Handshake,
  military: Shield,
  press: Newspaper,
  technology: FlaskConical,
  history: ScrollText,
}

import { parseNationProfile } from '@/lib/nation-profile.functions'

export const profileFixture = parseNationProfile(
  {
    id: 'demo-teste',
    name: 'República do Teste',
    short_name: 'Teste',
    capital: 'Vila Nova',
    region_id: 3,
    founded_year: 1920,
    currency_name: 'Teste',
    currency_code: 'TST',
    symbols: { nationalColor: '#F98B87' },
  },
  {
    governmentForm: 'republica',
    regime: 'democratico',
    system: 'presidencialismo',
    stateForm: 'unitario',
    legitimacy: 54,
    coherencePenalty: 0,
    localSelection: 'misto',
    headOfState: { title: 'Presidente', name: 'Alda' },
    events: [{ title: 'Fundação da República do Teste', type: 'fundacao', tickIndex: 0 }],
  },
)

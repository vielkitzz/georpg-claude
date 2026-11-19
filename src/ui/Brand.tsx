import icon from '@/assets/Icon.svg'

/** Emblema + marca. "GEO" em Imbue 400 e "RPG" em Imbue 700, ambos em creme. */
export function Brand({ showWordmark = true }: { showWordmark?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <img src={icon} alt="" width={36} height={36} className="size-9 shrink-0 rounded-[4px]" />
      {showWordmark && (
        <span
          aria-label="GeoRPG"
          className="font-title text-2xl leading-none text-[#FEFBEE]"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          <span style={{ fontWeight: 400 }}>GEO</span>
          <span style={{ fontWeight: 700 }}>RPG</span>
        </span>
      )}
    </span>
  )
}

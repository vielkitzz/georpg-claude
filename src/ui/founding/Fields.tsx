import { useId, useState, type ChangeEvent } from 'react'
import {
  SYMBOL_FIELDS,
  SYMBOL_IMAGE_BYTES,
  SYMBOL_IMAGE_SIDE,
  type FoundingSymbols,
} from '@/domain/founding/draft'

const fieldClass =
  'w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-fg focus:border-secondary'

export function Choice<T extends string>({
  label,
  value,
  values,
  names,
  available = values,
  onChange,
}: {
  label: string
  value: T
  values: readonly T[]
  names?: Record<T, string>
  available?: readonly T[]
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset>
      <legend className="subtitle mb-3 text-sm">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {values.map((option) => (
          <label key={option} className="founding-choice">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              disabled={!available.includes(option)}
              onChange={() => onChange(option)}
            />
            <span>{names?.[option] ?? option}</span>
            {!available.includes(option) && <small aria-hidden>Indisponível</small>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function TextField({
  label,
  value,
  onChange,
  max,
  placeholder,
  multiline = false,
  invalid = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  max?: number
  placeholder?: string
  multiline?: boolean
  invalid?: boolean
}) {
  const props = {
    className: fieldClass,
    value,
    maxLength: max,
    placeholder,
    'aria-invalid': invalid || undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  }
  return (
    <label className="grid gap-2 text-sm">
      <span className="subtitle">{label}</span>
      {multiline ? <textarea rows={4} {...props} /> : <input {...props} />}
    </label>
  )
}

export function SymbolImages({ flag, coatOfArms }: Pick<FoundingSymbols, 'flag' | 'coatOfArms'>) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {flag && (
        <img
          className="max-h-35 max-w-3/5 rounded object-contain"
          src={`data:image/png;base64,${flag}`}
          alt="Bandeira nacional"
        />
      )}
      {coatOfArms && (
        <img
          className="max-h-32 max-w-1/3 object-contain"
          src={`data:image/png;base64,${coatOfArms}`}
          alt="Brasão nacional"
        />
      )}
    </div>
  )
}

async function readPng(file: File): Promise<string> {
  if (file.type !== 'image/png' || file.size > SYMBOL_IMAGE_BYTES) throw new Error()
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (![137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte))
    throw new Error()
  const view = new DataView(bytes.buffer)
  for (const offset of [16, 20]) {
    const dimension = view.getUint32(offset)
    if (dimension < 1 || dimension > SYMBOL_IMAGE_SIDE) throw new Error()
  }
  const image = await createImageBitmap(file)
  image.close()
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function ImageField({
  label,
  value,
  onChange,
  onReading,
}: {
  label: string
  value: string
  onChange: (encoded: string) => void
  onReading: (reading: boolean) => void
}) {
  const [error, setError] = useState(false)
  const [reading, setReading] = useState(false)
  const select = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(false)
    setReading(true)
    onReading(true)
    try {
      onChange(await readPng(file))
    } catch {
      setError(true)
    } finally {
      setReading(false)
      onReading(false)
    }
  }
  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm">
        <span className="subtitle">{label}</span>
        <input
          type="file"
          accept="image/png,.png"
          className={fieldClass}
          disabled={reading}
          onChange={select}
        />
      </label>
      {value && (
        <button
          type="button"
          className="justify-self-start text-sm text-secondary underline"
          onClick={() => onChange('')}
        >
          Remover {label.toLowerCase()}
        </button>
      )}
      {reading && (
        <p role="status" className="text-sm">
          Lendo imagem…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-warning">
          Selecione um PNG válido de até 256 KiB e 2048 × 2048 pixels.
        </p>
      )}
    </div>
  )
}

export function SymbolFields({
  value,
  onChange,
  onReading,
  invalid,
}: {
  value: FoundingSymbols
  onChange: (field: keyof FoundingSymbols, value: string) => void
  onReading: (reading: boolean) => void
  invalid: boolean
}) {
  const colorId = useId()
  return (
    <>
      <p className="text-sm text-muted">
        Bandeira e brasão são opcionais. Use PNG de até 256 KiB e 2048 × 2048 pixels.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          label="Bandeira"
          value={value.flag}
          onChange={(image) => onChange('flag', image)}
          onReading={onReading}
        />
        <ImageField
          label="Brasão"
          value={value.coatOfArms}
          onChange={(image) => onChange('coatOfArms', image)}
          onReading={onReading}
        />
      </div>
      {(value.flag || value.coatOfArms) && <SymbolImages {...value} />}
      <div className="flex items-center gap-3 text-sm">
        <label className="subtitle" htmlFor={colorId}>
          Cor nacional
        </label>
        <input
          id={colorId}
          type="color"
          className="h-10 w-14 cursor-pointer rounded border border-line bg-bg p-1"
          value={value.color || '#EA444B'}
          onChange={(event) => onChange('color', event.target.value)}
          aria-invalid={(invalid && !value.color) || undefined}
        />
        <span className="text-muted">{value.color || 'A definir'}</span>
      </div>
      {!value.color && (
        <button
          type="button"
          className="justify-self-start text-sm text-secondary underline"
          onClick={() => onChange('color', '#EA444B')}
        >
          Usar a cor sugerida
        </button>
      )}
      {(
        Object.entries(SYMBOL_FIELDS) as [
          keyof typeof SYMBOL_FIELDS,
          (typeof SYMBOL_FIELDS)[keyof typeof SYMBOL_FIELDS],
        ][]
      ).map(([field, config]) => (
        <TextField
          key={field}
          {...config}
          invalid={invalid && value[field].trim().length < config.min}
          value={value[field]}
          onChange={(text) => onChange(field, text)}
        />
      ))}
    </>
  )
}

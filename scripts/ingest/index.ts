/**
 * TechSpec ingestion CLI.
 *
 *   npm run ingest -- --check <url>
 *   npm run ingest -- --category laptops --brand Lenovo
 *   npm run ingest -- --category mobiles --search "Galaxy S25" --out phones.json
 *   npm run ingest -- --sources
 *
 * Output is a TechSpec catalogue transfer file, so importing it goes through
 * exactly the same validation as a hand-written import — nothing bypasses the
 * schema. Discovered entries are *stubs*: name, brand and release year, with
 * specs left blank for you to fill in. That is a deliberate limit of the only
 * freely licensed source available, not an oversight.
 */

import { writeFile } from 'node:fs/promises'
import { PoliteFetcher, NotPermittedError } from './fetcher.ts'
import { REFUSED_SOURCES, SOURCES } from './registry.ts'
import {
  DEVICE_CLASSES,
  discoverByManufacturer,
  discoverByName,
  discoverRecent,
  enrich,
  isUsable,
  resolveManufacturer,
  type DiscoveredDevice,
} from './sources/wikidata.ts'

interface Options {
  category?: string
  brand?: string
  search?: string
  since?: number
  out: string
  limit: number
  check?: string
  listSources: boolean
  dryRun: boolean
}

function parseArgs(argv: string[]): Options {
  const options: Options = { out: 'ingested.json', limit: 100, listSources: false, dryRun: false }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = () => argv[++i]
    switch (arg) {
      case '--category': options.category = next(); break
      case '--brand': options.brand = next(); break
      case '--search': options.search = next(); break
      case '--since': options.since = Number(next()); break
      case '--out': options.out = next(); break
      case '--limit': options.limit = Number(next()); break
      case '--check': options.check = next(); break
      case '--sources': options.listSources = true; break
      case '--dry-run': options.dryRun = true; break
      default: break
    }
  }
  return options
}

const slug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

/**
 * Turn discoveries into catalogue stubs.
 *
 * Every field we cannot actually source is left blank rather than guessed —
 * price especially. A stub imports as an obviously incomplete device you then
 * fill in, which is honest; a stub with an invented price would poison every
 * comparison it appears in.
 */
function toTransfer(
  category: string,
  devices: DiscoveredDevice[],
  attribution: string,
): { file: object; count: number } {
  const seen = new Set<string>()
  const added = devices
    .filter(isUsable)
    .map((device) => {
      const id = slug(device.name)
      if (!id || seen.has(id)) return null
      seen.add(id)

      const brand = device.manufacturer?.trim() || 'Unknown'
      const missing: string[] = ['price', 'specs']
      if (!device.manufacturer) missing.push('brand')
      if (!device.releaseYear) missing.push('release year')

      return {
        id,
        name: device.name,
        brand,
        category,
        // Zero is not a plausible price and fails validation on import, which
        // is the point: you must supply a real one. Release year does the same
        // when Wikidata does not know it — inventing "this year" would put a
        // wrong fact into a comparison, which is worse than a blocked import.
        price: 0,
        releaseYear: device.releaseYear ?? 0,
        rating: 0,
        tagline:
          (device.description ?? 'Imported stub') + ` — still needs: ${missing.join(', ')}.`,
        accent: '#2563eb',
        specs: {},
        _source: device.sourceUrl,
        _attribution: attribution,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  return {
    file: {
      format: 'techspec/catalogue',
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: {
        [category]: { version: 1, edits: {}, added, removed: [], updatedAt: Date.now() },
      },
    },
    count: added.length,
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const fetcher = new PoliteFetcher(options.dryRun)

  /* --------------------------------------------------------- --sources */
  if (options.listSources) {
    console.log('\nAllowed sources (robots.txt AND a recorded legal basis):\n')
    for (const source of SOURCES) {
      console.log(`  ${source.label} [${source.kind}]`)
      console.log(`    origins : ${source.origins.join(', ')}`)
      console.log(`    licence : ${source.licence}`)
      console.log(`    basis   : ${source.legalBasis}`)
      console.log(`    throttle: ${source.minIntervalMs}ms between requests\n`)
    }
    console.log('Refused sources:\n')
    for (const refused of REFUSED_SOURCES) {
      console.log(`  ${refused.host}\n    ${refused.reason}\n`)
    }
    return
  }

  /* ----------------------------------------------------------- --check */
  if (options.check) {
    const decision = await fetcher.permission(options.check)
    console.log(`\n${options.check}`)
    console.log(`  ${decision.allowed ? 'ALLOWED' : 'REFUSED'} — ${decision.reason}`)
    if (decision.source) console.log(`  licence: ${decision.source.licence}`)
    process.exitCode = decision.allowed ? 0 : 1
    return
  }

  if (!options.category || !DEVICE_CLASSES[options.category]) {
    console.error(
      `\nPass --category with one of: ${Object.keys(DEVICE_CLASSES).join(', ')}\n` +
        `Then either --brand <maker> or --search <text> or --since <year>.\n` +
        `Use --sources to see what may legally be read, or --check <url> to test one.\n`,
    )
    process.exitCode = 1
    return
  }

  const deviceClass = DEVICE_CLASSES[options.category]
  console.log(`\nCategory: ${options.category} (${deviceClass.label}, ${deviceClass.qid})`)

  let devices: DiscoveredDevice[] = []

  try {
    if (options.brand) {
      const maker = await resolveManufacturer(fetcher, options.brand)
      if (!maker) {
        console.error(`Could not resolve a Wikidata entity for "${options.brand}".`)
        process.exitCode = 1
        return
      }
      console.log(`Manufacturer: ${maker.label} (${maker.qid}) — ${maker.description ?? ''}`)
      devices = await discoverByManufacturer(fetcher, deviceClass.qid, maker.qid, options.limit)
    } else if (options.search) {
      console.log(`Searching: "${options.search}"`)
      devices = await enrich(fetcher, await discoverByName(fetcher, options.search, options.limit))
    } else if (options.since) {
      console.log(`Released since: ${options.since}`)
      devices = await discoverRecent(fetcher, deviceClass.qid, options.since, options.limit)
    } else {
      console.error('Pass one of --brand, --search or --since.')
      process.exitCode = 1
      return
    }
  } catch (error) {
    if (error instanceof NotPermittedError) {
      console.error(`\nRefused: ${error.message}`)
      process.exitCode = 1
      return
    }
    throw error
  }

  const usable = devices.filter(isUsable)
  console.log(`\nFound ${devices.length} entities, ${usable.length} usable:\n`)
  for (const device of usable.slice(0, 30)) {
    const year = device.releaseYear ? ` (${device.releaseYear})` : ''
    console.log(`  · ${device.name}${year}${device.manufacturer ? ` — ${device.manufacturer}` : ''}`)
  }
  if (usable.length > 30) console.log(`  … and ${usable.length - 30} more`)

  if (usable.length === 0) {
    console.log(
      '\nNothing usable. Wikidata models device *series* better than individual SKUs,\n' +
        'so per-model laptop coverage in particular is thin. Try --search instead.\n',
    )
    return
  }

  const attribution = SOURCES.find((s) => s.id === 'wikidata')?.attribution ?? 'Wikidata (CC0)'
  const { file, count } = toTransfer(options.category, usable, attribution)
  await writeFile(options.out, JSON.stringify(file, null, 2), 'utf8')

  console.log(`\nWrote ${count} stubs to ${options.out}`)
  console.log('Import via Settings → Your catalogue → Import JSON.')
  console.log(
    'Every stub has price 0 and no specs, so the importer will reject it until you\n' +
      'fill those in — deliberately, so an unpriced device never enters a comparison.\n',
  )
  console.log(`Attribution: ${attribution}`)
  console.log(`Requests made: ${fetcher.log.length}`)
}

main().catch((error) => {
  console.error('\nIngestion failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})

import {Browser, Page} from 'playwright'
import {ListingAddress, ListingDetails, URLFetchResult} from '../../typescript/interfaces'
import pc from 'picocolors'
import fs from 'fs'
import path from 'path'
import scraperConfig from '../../../scraper.config'
import {PetType} from '../../typescript/types'

interface Config {
  bedrooms?: number | number[]
  bathrooms?: number | number[],
  pets?: PetType
  minPrice?: number
  maxPrice?: number
  inUnitLaundry?: boolean,
  postalCode?: number,
  searchDistance?: number
}

interface ScraperParams {
  url: string,
  name: string,
  config?: Config
}

interface StdOutConfig {
  logType: 'log' | 'info' | 'success' | 'error',
  newLine?: boolean
}

export default abstract class Scraper {
  private _browser?: Browser
  private _page?: Page
  private readonly _url: string
  private readonly _name: string

  protected constructor ({ url, name, config = undefined }: ScraperParams) {
    new Error()
    const playwright = require('playwright')

    if (config) this.config = config
    this._url = url
    this._name = name

    playwright.chromium.launch({
      headless: true
    }).then((browser: Browser) => {
      this._browser = browser
      this._browser.newPage()
        .then((page: Page) => {
          this._page = page
          this.init()
        })
        .catch((error: any) => console.error(`Page could not be initialized for ${name}\n`, error))
    }).catch((error: any) => console.error(`Browser could not be initialized for ${name}\n`, error))

  }

  config: Config = scraperConfig

  get browser () {
    return this._browser as Browser
  }

  get page () {
    return this._page as Page
  }

  get url () {
    return this._url as string
  }

  private async init () {
    this.info('Initializing scraper...')
    try {
      // TODO: See if it's possible to change the user agent per request
      // this.page.on('request', async (request) => {
      //   const headers = request.headers()
      //   this.info(Object.keys(headers))
      // })

      this.page.on('response', async (response) => {
        if (response.status() === 403) {
          this.error('Forbidden request, you may have been timed out due to too many requests.')
          await this.close()
        }
      })
      await this.page.goto(this.url)

      await this.applySettings()
      this.success('Applied search criteria')
    } catch (error) {
      this.error('An error occurred while applying search criteria, closing...', error)
      await this.exit(1)
    }

    try {
      this.log('Beginning scraping...')
      await this.scrape()
    } catch (error) {
      this.error('An error occurred while scraping, closing...', error)
      await this.exit(1)
    } finally {
      await this.exit()
    }
  }

  async fetchAll (urls: string[], batchSize = 500) {
    this.log(`Fetching URLs...`)

    let position = 0
    let results: URLFetchResult[] = []

    while (position < urls.length) {
      const batch = urls.slice(position, position + batchSize)
      const data = await Promise.allSettled(batch.map(async (url) => {
        const response = await fetch(url)

        return {
          url: url,
          response: await response.text() || ''
        }
      }))

      const response = data
        .map((result) => {
          if (result.status === 'fulfilled') {
            return result.value
          }
        })

      // @ts-expect-error Type '(URLFetchResult | undefined)[]' is not assignable to type 'URLFetchResult[]'.
      results = [
        ...results,
        ...response
      ]

      this.success(`Resolved ${Math.min(position + batchSize, urls.length)} requests`)

      position += batchSize
    }

    return results
  }

  async outputScrapingResults (results: ListingDetails[]) {
    const fileName = path.resolve(path.join(process.cwd(), `src/scraping-results/${this._name.toLowerCase()}.json`))

    this.log(`Writing ${results.length} results to ${fileName}`)
    try {
      fs.writeFileSync(fileName, JSON.stringify(results), 'utf8')
      this.success(`Scraping complete!`)
    } catch (error) {
      this.error('An error occurred while outputting scraping results', error)
    }
  }

  formatAddress ({ street, city, state, postalCode }: ListingAddress) {
    return [street, city, state, postalCode].filter(Boolean).join(', ')
  }

  printToSameLine ({ logType, newLine }: StdOutConfig, ...args: any) {
    switch (logType) {
      case 'log':
        process.stdout.write(pc.blue(`[${this._name}] — ${args}\x1b[0G${newLine ? '\n' : ''}`))
        break;
      case 'info':
        process.stdout.write(pc.yellow(`[${this._name}] — ${args}\x1b[0G${newLine ? '\n' : ''}`))
        break;
      case 'success':
        process.stdout.write(pc.green(`[${this._name}] — ${args}\x1b[0G${newLine ? '\n' : ''}`))
        break;
      case 'error':
        process.stdout.write(pc.red(`[${this._name}] — ${args}\x1b[0G${newLine ? '\n' : ''}`))
        break;
    }
  }

  log (...args: any) {
    console.log(pc.blue(`[${this._name}] — ${args}`))
  }

  info (...args: any) {
    console.info(pc.yellow(`[${this._name}] — ${args}`))
  }

  success (...args: any) {
    console.log(pc.green(`[${this._name}] — ${args}`))
  }

  error (...args: any) {
    console.error(pc.red(`[${this._name}] — ${args}\n`))
  }

  abstract scrape (): void

  abstract applySettings (): void

  async close () {
    await this.browser.close()
  }

  async exit (code?: 0 | 1) {
    await this.close()
    process.exit(code)
  }
}

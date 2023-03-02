import Scraper from './Scraper'
import { JSDOM } from 'jsdom'
import {ListingDetails, URLFetchResult} from "../../typescript/interfaces";
import fs from 'fs'

interface CraigslistListingDetails {
  numberOfBedrooms?: string,
  longitude?: string,
  name?: string,
  '@context'?: string,
  latitude?: string,
  numberOfBathroomsTotal?: number,
  address?: {
    streetAddress?: string,
    addressCountry?: string,
    addressLocality?: string,
    postalCode?: string,
    addressRegion?: string,
    '@type'?: string
  },
  petsAllowed?: boolean,
  '@type'?: string
}

export default class CraigslistScraper extends Scraper {
  constructor() {
    super({
      url: 'https://minneapolis.craigslist.org/search/apa',
      name: 'Craigslist'
    });
  }

  async applySettings () {
    await this.page.getByPlaceholder('miles').click();
    await this.page.getByPlaceholder('miles').fill('25');
    await this.page.getByPlaceholder('from zip').click();
    await this.page.getByPlaceholder('from zip').fill('55401');
    await this.page.getByLabel('bundle duplicates').check()
    await this.page.getByRole('textbox', { name: 'min' }).click();
    await this.page.getByRole('textbox', { name: 'min' }).fill(String(this.config.minPrice));
    await this.page.getByRole('textbox', { name: 'max' }).click();
    await this.page.getByRole('textbox', { name: 'max' }).fill(String(this.config.maxPrice));
    await this.page.locator('select[name="min_bedrooms"]').selectOption(String(this.config.bedrooms));

    switch (this.config.pets) {
      case 'cats':
        await this.page.getByLabel('cats ok').check()
        break
      case 'dogs':
        await this.page.getByLabel('dogs ok').check()
        break
      case true:
        await this.page.getByLabel('cats ok').check()
        await this.page.getByLabel('dogs ok').check()
        break
    }

    if (this.config.inUnitLaundry) {
      await this.page.getByText('▸▾ laundry').click();
      await this.page.getByLabel('w/d in unit').check();
    }

    await this.page.getByRole('link', { name: 'newest' }).click();
    await this.page.getByRole('link', { name: '﹩→ $$$' }).click();
    await this.page.getByRole('button', { name: 'update search' }).click();
  }

  async scrape () {
    const requests = []

    while (true) {
      await this.page.waitForSelector('a[class*="result-title"]', { timeout: 5000 })
      // @ts-expect-error href does not exist on HTMLElement
      const urls = await this.page.$$eval('a[class*="result-title"]', (nodes => nodes.map(node => node.href)))
      requests.push(...urls)

      const currentResult = await this.page.innerText('.rangeTo')
      const maxResult = await this.page.innerText('.totalcount')

      this.printToSameLine({ logType: 'success', newLine: currentResult >= maxResult}, `Scraped ${requests.length} pages`)

      if (Number(currentResult) < Number(maxResult)) await this.page.locator('a.button.next').first().click();
      else break
    }

    const response = await this.fetchAll(requests)
    const data = this.parseHTML(response)

    await this.outputScrapingResults(data)
  }

  parseHTML (pages: URLFetchResult[]) {
    const listings: ListingDetails[] = []

    pages.forEach((page, index) => {
      this.printToSameLine({ logType: 'info', newLine: index + 1 === pages.length}, `Parsing page ${index + 1}`)

      const dom = new JSDOM(page.response)
      const price = dom.window.document.querySelector('.price')?.textContent?.replace(/(\D)/gm, '')
      const housing = dom.window.document.querySelector('.housing')?.textContent
      const squareFootage = housing?.split(' ')?.find(item => item.includes('ft'))?.replace(/\D.*/gm, '')

      // @ts-expect-error Property 'src' does not exist on type 'Element'
      const image = dom.window.document.querySelector('img[title="1"]')?.src
      const listingDetails = dom.window.document.querySelector('#ld_posting_data')?.textContent
      const removed = Boolean(dom.window.document.querySelector('.removed')?.textContent)
      const blocked = Boolean(dom.window.document.querySelector('[title="blocked"]')?.textContent)

      if (listingDetails) {
        const details = JSON.parse(listingDetails) as CraigslistListingDetails
        const {
          address,
          numberOfBathroomsTotal,
          numberOfBedrooms,
          petsAllowed
        } = details

        listings.push({
          address: this.formatAddress({
            street: address?.streetAddress,
            city: address?.addressLocality,
            state: address?.addressRegion,
            postalCode: address?.postalCode
          }),
          bathrooms: numberOfBathroomsTotal || 'Unknown',
          bedrooms: Number(numberOfBedrooms) || 'Unknown',
          image: image,
          petsAllowed: Boolean(petsAllowed),
          price: Number(price) || 'Unknown',
          size: Number(squareFootage) || 'Unknown',
          type: details['@type'] || 'Unknown',
          url: page.url
        })
      } else {
        const message = `Could not parse listing details for page with URL ${page.url}`

        if (removed) this.error(`${message} because it was removed`)
        else if (blocked) this.error(`${message} because it was blocked`)
        else this.error(`${message}`)
      }
    })

    return listings
  }
}

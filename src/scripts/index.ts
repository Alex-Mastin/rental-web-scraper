import CraigslistScraper from './scrapers/CraigslistScraper'

async function main() {
  await Promise.all([
    new CraigslistScraper()
  ])
}

main()

export interface ListingDetails {
  address?: string
  bathrooms?: number | 'Unknown'
  bedrooms?: number | 'Unknown'
  image?: string
  petsAllowed?: boolean
  price?: number | 'Unknown'
  size?: number | 'Unknown'
  type?: string
  url: string
}

export interface ListingAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
}

export interface URLFetchResult {
  url: string
  response: string
}

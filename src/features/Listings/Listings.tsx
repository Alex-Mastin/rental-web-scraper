import { Card } from '../../components'
import './styles.scss'
import craigslist from '../../scraping-results/craigslist.json'
import {ListingDetails} from "../../typescript/interfaces";
import {useEffect, useState} from "react";

interface Props {
  // No additional props provided
}

function paginate (items: any[], pageNumber = 1, pageSize = 48) {
  return items.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize)
}

export default function Listings(props: Props) {
  // @ts-expect-error Type 'string' is not assignable to type 'number | "Unknown" | undefined'.
  const listings: ListingDetails[] = [
    ...craigslist
  ]

  const [currentPage, setCurrentPage] = useState(1)
  let totalPages = Math.ceil(listings.length / 48)
  const [items, setItems] = useState(paginate(listings, currentPage))

  function onClick (url: string) {
    window.open(url, '_blank')
  }

  function goToPage (page: number) {
    setCurrentPage(page)
    setItems(paginate(listings, page))
  }

  useEffect(() => {
    console.log(currentPage)
  }, [currentPage])

  return (
    <div className="listings-page">
      <h1>
        {`Listings (${listings.length})`}
      </h1>
      <button onClick={() => goToPage(Math.max(1, currentPage - 1))}>
        Back
      </button>
      <button onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}>
        Next
      </button>
      <div className="listings">
        {
          items.map((item, index) => {
            return (
              <Card
                key={index}
                onClick={() => onClick(item.url)}
              >
                <div className="listing">
                  {
                    item.image
                      ? (
                        <Card.Image
                          className="listing-image"
                          src={item.image}
                        />
                      )
                      : <div className="image-placeholder"/>
                  }
                  <span className="listing-price">
                    {`$${item.price}`}
                  </span>
                  <div className="listing-details">
                    <div className="unit-details">
                    <span className="unit-beds">
                      {item.bedrooms}
                    </span>
                      <span className="unit-baths">
                      {item.bathrooms}
                    </span>
                      <span className="unit-size">
                      {item.size}
                    </span>
                    </div>
                    <div className="unit-additional-details">
                    <span className="unit-type">
                      {item.type}
                    </span>
                      <span className="pets-allowed">
                      {item.petsAllowed ? 'yes' : 'no'}
                    </span>
                    </div>
                  </div>
                  <span className="unit-address">
                  {item.address}
                </span>
                </div>
              </Card>
            )
          })
        }
      </div>
    </div>
  )
}

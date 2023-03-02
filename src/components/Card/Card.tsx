import './styles.scss'
import React, {HTMLAttributes, ImgHTMLAttributes} from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  // No additional props provided
}

function Card (props: Props) {
  // @ts-expect-error Type does not exist on child
  const Image = React.Children.map(props.children!, (child) => child?.type?.displayName === 'CardImage' ? child : null)
  // @ts-expect-error Type does not exist on child
  const children = React.Children.map(props.children!, (child) => child?.type?.displayName !== 'CardImage' ? child : null)

  return (
    <div
      className="card"
      { ...props }
    >
      { Image }
      <div className="card-body">
        { children }
      </div>
    </div>
  )
}

function CardImage (props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <div className="card-image-container">
      <img
        alt="image"
        {...props}
      />
    </div>
  )
}

CardImage.displayName = 'CardImage'
Card.Image = CardImage

export default Card

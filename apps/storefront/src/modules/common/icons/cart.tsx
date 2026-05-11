import React from "react"
import { IconProps } from "types/icon"

const ShoppingCartIcon: React.FC<IconProps> = ({
  size = "24",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M3 3H5L6.4 11M6.4 11L8.5 18H15.5L17.6 11M6.4 11L7.5 6M17.6 11L18.5 6M9 21C9.55228 21 10 20.5523 10 20C10 19.4477 9.55228 19 9 19C8.44772 19 8 19.4477 8 20C8 20.5523 8.44772 21 9 21ZM15 21C15.5523 21 16 20.5523 16 20C16 19.4477 15.5523 19 15 19C14.4477 19 14 19.4477 14 20C14 20.5523 14.4477 21 15 21Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ShoppingCartIcon
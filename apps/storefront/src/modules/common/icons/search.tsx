import React from "react"
import { IconProps } from "types/icon"

const SearchIcon: React.FC<IconProps> = ({
  size = "16",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M17.5 17.5L13.875 13.875M15.8333 8.75C15.8333 12.4774 12.8107 15.5 9.08333 15.5C5.35595 15.5 2.33333 12.4774 2.33333 8.75C2.33333 5.02261 5.35595 2 9.08333 2C12.8107 2 15.8333 5.02261 15.8333 8.75Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default SearchIcon
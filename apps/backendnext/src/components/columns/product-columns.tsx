"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/services/product-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"

export const productColumns = (onDelete?: (product: Product) => void): ColumnDef<Product>[] => [
  {
    accessorKey: "image_url",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image_url") as string
      if (!imageUrl) {
        return <div className="w-10 h-10 bg-gray-200 rounded" />
      }
      return (
        <img 
          src={imageUrl} 
          alt={row.getValue("name")} 
          className="w-10 h-10 rounded object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      return <div className="font-medium">{name}</div>
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => {
      const sku = row.getValue("sku") as string
      return <span className="text-muted-foreground">{sku || '-'}</span>
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      return <div>{price.toLocaleString('fr-TN')} TND</div>
    },
  },
  {
    accessorKey: "stock_quantity",
    header: "Stock",
    cell: ({ row }) => {
      const stock = parseInt(row.getValue("stock_quantity"))
      const isLow = stock <= 10 && stock > 0
      const isOutOfStock = stock === 0
      
      return (
        <Badge variant={isOutOfStock ? "destructive" : isLow ? "secondary" : "default"}>
          {stock}
        </Badge>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original

      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/products/${product.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          {onDelete && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(product)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      )
    },
  },
]
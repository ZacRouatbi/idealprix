import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-gray-200">
        <nav className="content-container txt-xsmall-plus text-gray-600 flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-gray-900 uppercase"
              data-testid="nav-store-link"
            >
              IdealPrix
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-gray-900"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-gray-900 flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
      {/* Store Menu Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="content-container flex items-center h-10 text-sm">
          <LocalizedClientLink
            href="/"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Accueil
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/products"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Tous les produits
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/products?category=produits-de-nettoyage"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Nettoyage
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/products?category=cosmetiques"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Cosmétiques
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/products?category=vaisselle"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Vaisselle
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/products?promo=true"
            className="text-[#D4302A] font-medium"
          >
            Promotions
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

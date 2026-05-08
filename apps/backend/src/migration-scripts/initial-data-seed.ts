// File: data/seed.ts (or wherever your seed file is located)
import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  // Only Tunisia
  const countries = ["tn"];

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "IdealPrix Online",
          description: "Default sales channel for IdealPrix",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Default Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  const {
    result: [store],
  } = await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "IdealPrix",
          supported_currencies: [
            {
              currency_code: "tnd",
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Sousse",
          currency_code: "tnd",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",        // system default tax provider
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Sousse Main Warehouse",
          address: {
            city: "Sousse",
            country_code: "TN",
            address_1: "Avenue Habib Bourguiba",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Sousse Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Tunisia",
        geo_zones: [
          {
            country_code: "tn",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  // Shipping options – prices only in TND
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Livraison en 2-3 jours",
          code: "standard",
        },
        prices: [
          {
            currency_code: "tnd",
            amount: 7,
          },
          {
            region_id: region.id,
            amount: 7,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Livraison en 24h",
          code: "express",
        },
        prices: [
          {
            currency_code: "tnd",
            amount: 14,
          },
          {
            region_id: region.id,
            amount: 14,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Vêtements",
          is_active: true,
        },
        {
          name: "Accessoires",
          is_active: true,
        },
        {
          name: "Épicerie",
          is_active: true,
        },
        {
          name: "Promotions",
          is_active: true,
        },
      ],
    },
  });

  // Sample products adapted for IdealPrix with prices in TND
  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "T-Shirt Basique",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Vêtements")!.id,
          ],
          description:
            "Un t-shirt classique en coton peigné, disponible en plusieurs couleurs et tailles.",
          handle: "t-shirt-basique",
          weight: 200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
            },
          ],
          options: [
            {
              title: "Taille",
              values: ["S", "M", "L", "XL"],
            },
            {
              title: "Couleur",
              values: ["Noir", "Blanc"],
            },
          ],
          variants: [
            {
              title: "S / Noir",
              sku: "TSHIRT-S-NOIR",
              options: { Taille: "S", Couleur: "Noir" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
            {
              title: "S / Blanc",
              sku: "TSHIRT-S-BLANC",
              options: { Taille: "S", Couleur: "Blanc" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
            {
              title: "M / Noir",
              sku: "TSHIRT-M-NOIR",
              options: { Taille: "M", Couleur: "Noir" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
            {
              title: "M / Blanc",
              sku: "TSHIRT-M-BLANC",
              options: { Taille: "M", Couleur: "Blanc" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
            {
              title: "L / Noir",
              sku: "TSHIRT-L-NOIR",
              options: { Taille: "L", Couleur: "Noir" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
            {
              title: "L / Blanc",
              sku: "TSHIRT-L-BLANC",
              options: { Taille: "L", Couleur: "Blanc" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
            {
              title: "XL / Noir",
              sku: "TSHIRT-XL-NOIR",
              options: { Taille: "XL", Couleur: "Noir" },
              prices: [{ amount: 30, currency_code: "tnd" }],
            },
            {
              title: "XL / Blanc",
              sku: "TSHIRT-XL-BLANC",
              options: { Taille: "XL", Couleur: "Blanc" },
              prices: [{ amount: 30, currency_code: "tnd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Sweat à Capuche",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Vêtements")!.id,
          ],
          description:
            "Sweat à capuche doux et confortable, idéal pour les journées décontractées.",
          handle: "sweat-capuche",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
          ],
          options: [
            {
              title: "Taille",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SWEAT-S",
              options: { Taille: "S" },
              prices: [{ amount: 45, currency_code: "tnd" }],
            },
            {
              title: "M",
              sku: "SWEAT-M",
              options: { Taille: "M" },
              prices: [{ amount: 45, currency_code: "tnd" }],
            },
            {
              title: "L",
              sku: "SWEAT-L",
              options: { Taille: "L" },
              prices: [{ amount: 45, currency_code: "tnd" }],
            },
            {
              title: "XL",
              sku: "SWEAT-XL",
              options: { Taille: "XL" },
              prices: [{ amount: 50, currency_code: "tnd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Pantalon Jogging",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Vêtements")!.id,
          ],
          description:
            "Pantalon de jogging en coton mélangé, coupe ample et élastique à la taille.",
          handle: "pantalon-jogging",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
            },
          ],
          options: [
            {
              title: "Taille",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "JOGGING-S",
              options: { Taille: "S" },
              prices: [{ amount: 35, currency_code: "tnd" }],
            },
            {
              title: "M",
              sku: "JOGGING-M",
              options: { Taille: "M" },
              prices: [{ amount: 35, currency_code: "tnd" }],
            },
            {
              title: "L",
              sku: "JOGGING-L",
              options: { Taille: "L" },
              prices: [{ amount: 35, currency_code: "tnd" }],
            },
            {
              title: "XL",
              sku: "JOGGING-XL",
              options: { Taille: "XL" },
              prices: [{ amount: 40, currency_code: "tnd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Short de Sport",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Vêtements")!.id,
          ],
          description:
            "Short léger et respirant, parfait pour l'entraînement ou les loisirs.",
          handle: "short-sport",
          weight: 200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
            },
          ],
          options: [
            {
              title: "Taille",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SHORT-S",
              options: { Taille: "S" },
              prices: [{ amount: 20, currency_code: "tnd" }],
            },
            {
              title: "M",
              sku: "SHORT-M",
              options: { Taille: "M" },
              prices: [{ amount: 20, currency_code: "tnd" }],
            },
            {
              title: "L",
              sku: "SHORT-L",
              options: { Taille: "L" },
              prices: [{ amount: 20, currency_code: "tnd" }],
            },
            {
              title: "XL",
              sku: "SHORT-XL",
              options: { Taille: "XL" },
              prices: [{ amount: 25, currency_code: "tnd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000,          // realistic stock for local store
        inventory_item_id: item.id,
      })),
    },
  });
  logger.info("Finished seeding inventory levels data.");
}
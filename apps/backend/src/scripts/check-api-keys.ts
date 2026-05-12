import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function check_api_keys({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "type", "token"]
  });
  
  console.log("API Keys found:");
  apiKeys.forEach((key: any) => {
    console.log(`  - ${key.title} (${key.type}): ${key.token?.substring(0, 20)}...`);
  });
}
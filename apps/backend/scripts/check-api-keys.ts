import { Medusa } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

async function main() {
  const { container } = await import("../src");
  
  // This script just helps identify the issue
  console.log("Checking API keys...");
}

main().catch(console.error);
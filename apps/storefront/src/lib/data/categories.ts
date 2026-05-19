import { fetchCategories, type MedusaCategory } from './backend-adapter'

export { fetchCategories, type MedusaCategory }

export interface CategoryNode extends MedusaCategory {
  children?: CategoryNode[]
}

export const listCategories = async (query?: Record<string, unknown>): Promise<CategoryNode[]> => {
  const limit = (query?.limit as number) || 100
  
  const categories = await fetchCategories()
  
  // Build hierarchy: add children to parent categories
  const categoryMap = new Map<string, CategoryNode>()
  categories.forEach(c => {
    categoryMap.set(c.id, { ...c, children: [] })
  })

  const rootCategories: CategoryNode[] = []
  categoryMap.forEach(cat => {
    const parentId = cat.parent_category_id || cat.parent_id
    if (parentId && categoryMap.has(parentId)) {
      const parent = categoryMap.get(parentId)!
      parent.children!.push(cat)
    } else {
      rootCategories.push(cat)
    }
  })

  return rootCategories
}

export const getCategoryByHandle = async (categoryHandle: string | string[]): Promise<MedusaCategory | null> => {
  const handle = Array.isArray(categoryHandle) ? categoryHandle[categoryHandle.length - 1] : categoryHandle
  const categories = await fetchCategories()
  return categories.find(c => c.handle === handle) || null
}
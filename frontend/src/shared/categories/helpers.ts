/**
 * Shared category helper functions
 */

import { CategoryNode, BaseCategory } from './types';

/**
 * Get all descendant category IDs including the target category
 * @param categories - Array of category nodes
 * @param targetId - The target category ID to find descendants for
 * @returns Array of category IDs including the target and all its descendants
 */
export function getDescendantCategoryIds(categories: CategoryNode[], targetId: number): number[] {
  const result: number[] = [targetId];

  // Helper to find the node and its children recursively
  const findAndCollect = (nodes: CategoryNode[], found: boolean = false) => {
    for (const node of nodes) {
      if (found || node.id === targetId) {
        if (!found && node.id === targetId) {
          // We found the target node, now collect all its children
          if (node.children && node.children.length > 0) {
            collectAllChildren(node.children);
          }
          return true; // Stop searching other branches at this level
        } else if (found) {
          // We are already inside the target's subtree
          result.push(node.id);
          if (node.children && node.children.length > 0) {
            collectAllChildren(node.children);
          }
        }
      } else if (node.children && node.children.length > 0) {
        // Not found yet, search children
        findAndCollect(node.children, false);
      }
    }
    return false;
  };

  const collectAllChildren = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      result.push(node.id);
      if (node.children && node.children.length > 0) {
        collectAllChildren(node.children);
      }
    }
  };

  findAndCollect(categories);

  return result;
}

/**
 * Find a category by ID in a tree structure
 * @param categories - Array of category nodes
 * @param id - The category ID to find
 * @returns The category node or null if not found
 */
export function findCategoryById(categories: CategoryNode[], id: number): CategoryNode | null {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children && category.children.length > 0) {
      const found = findCategoryById(category.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Find the path from root to a specific category
 * @param categories - Array of category nodes
 * @param targetId - The target category ID
 * @returns Array of category IDs from root to target, or empty array if not found
 */
export function getCategoryPath(categories: CategoryNode[], targetId: number): number[] {
  const path: number[] = [];

  const findPath = (nodes: CategoryNode[], found: boolean = false): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        path.push(node.id);
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (findPath(node.children, false)) {
          path.push(node.id);
          return true;
        }
      }
    }
    return false;
  };

  findPath(categories);
  return path.reverse();
}

/**
 * Get all leaf categories (categories without children)
 * @param categories - Array of category nodes
 * @returns Array of leaf category nodes
 */
export function getLeafCategories(categories: CategoryNode[]): CategoryNode[] {
  const leaves: CategoryNode[] = [];

  const collectLeaves = (nodes: CategoryNode[]) => {
    for (const node of nodes) {
      if (!node.children || node.children.length === 0) {
        leaves.push(node);
      } else {
        collectLeaves(node.children);
      }
    }
  };

  collectLeaves(categories);
  return leaves;
}

/**
 * Convert flat category list to nested tree structure
 * @param flatCategories - Flat array of categories with parent_id references
 * @param rootParentId - The parent_id value that identifies root categories (default: null)
 * @returns Nested tree structure
 */
export function buildCategoryTree(
  flatCategories: BaseCategory[],
  rootParentId: number | null = null
): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  // First pass: create all nodes
  for (const cat of flatCategories) {
    const node: CategoryNode = {
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id,
      children: [],
    };
    map.set(cat.id, node);
  }

  // Second pass: build relationships
  for (const cat of flatCategories) {
    const node = map.get(cat.id)!;
    
    // Add additional properties from the original category
    if (cat.description !== undefined) node.description = cat.description;
    if (cat.created_at !== undefined) node.created_at = cat.created_at;
    if (cat.updated_at !== undefined) node.updated_at = cat.updated_at;

    // If parent exists, add to parent's children
    if (cat.parent_id !== null && cat.parent_id !== undefined && map.has(cat.parent_id)) {
      const parent = map.get(cat.parent_id)!;
      parent.children.push(node);
    }
  }

  // Third pass: collect roots
  for (const cat of flatCategories) {
    if (cat.parent_id === rootParentId) {
      const node = map.get(cat.id);
      if (node) {
        roots.push(node);
      }
    }
  }

  return roots;
}

/**
 * Get category depth in the tree
 * @param categories - Array of category nodes
 * @param categoryId - The category ID to get depth for
 * @returns Depth level (0 for root categories)
 */
export function getCategoryDepth(categories: CategoryNode[], categoryId: number): number {
  let depth = 0;

  const findDepth = (nodes: CategoryNode[], currentDepth: number): boolean => {
    for (const node of nodes) {
      if (node.id === categoryId) {
        depth = currentDepth;
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (findDepth(node.children, currentDepth + 1)) {
          return true;
        }
      }
    }
    return false;
  };

  findDepth(categories, 0);
  return depth;
}

/**
 * Check if one category is a descendant of another
 * @param categories - Array of category nodes
 * @param descendantId - Potential descendant category ID
 * @param ancestorId - Potential ancestor category ID
 * @returns True if descendantId is a descendant of ancestorId
 */
export function isDescendantOf(
  categories: CategoryNode[],
  descendantId: number,
  ancestorId: number
): boolean {
  if (descendantId === ancestorId) {
    return false; // Not a descendant of itself
  }

  const descendantIds = getDescendantCategoryIds(categories, ancestorId);
  return descendantIds.includes(descendantId);
}

/**
 * Get siblings of a category (other categories with the same parent)
 * @param categories - Array of category nodes
 * @param categoryId - The category ID to find siblings for
 * @returns Array of sibling category nodes
 */
export function getCategorySiblings(categories: CategoryNode[], categoryId: number): CategoryNode[] {
  const siblings: CategoryNode[] = [];
  let parentId: number | null = null;

  const findParentAndSiblings = (nodes: CategoryNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === categoryId) {
        return true;
      }
      if (node.children && node.children.length > 0) {
        const found = node.children.some(child => child.id === categoryId);
        if (found) {
          parentId = node.id;
          // Add all children except the target
          siblings.push(...node.children.filter(child => child.id !== categoryId));
          return true;
        }
        findParentAndSiblings(node.children);
      }
    }
    return false;
  };

  findParentAndSiblings(categories);
  return siblings;
}

/**
 * Category helpers
 * Note: For new projects, use the shared categories module instead
 * @see @/shared/categories
 */

export interface BaseCategoryNode {
  id: number;
  parent_id: number | null;
  children?: BaseCategoryNode[];
  [key: string]: any;
}

/**
 * Get all descendant category IDs including the target category
 * @deprecated Use @/shared/categories/getDescendantCategoryIds instead
 */
export function getDescendantCategoryIds(categories: BaseCategoryNode[], targetId: number): number[] {
  const result: number[] = [targetId];

  // Helper to find the node and its children recursively
  const findAndCollect = (nodes: BaseCategoryNode[], found: boolean = false) => {
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

  const collectAllChildren = (nodes: BaseCategoryNode[]) => {
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

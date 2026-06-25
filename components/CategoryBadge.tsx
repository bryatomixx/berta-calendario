import { Badge } from '@/components/ui/Badge';
import type { Category } from '@/lib/types';

/**
 * Wrapper de conveniencia que delega al primitivo Badge.
 * Se mantiene para compatibilidad con importaciones existentes.
 */
export function CategoryBadge({ category }: { category: Category }) {
  return <Badge variant="category" value={category} size="xs" />;
}

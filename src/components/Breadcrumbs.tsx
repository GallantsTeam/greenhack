
// src/components/Breadcrumbs.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Хлебные крошки" className={cn("text-base text-muted-foreground", className)}> {/* Increased from text-sm */}
      <ol className="flex items-center space-x-1.5">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-5 w-5 text-muted-foreground/70" />} {/* Increased icon size */}
            <Link
              href={item.href}
              className={cn(
                "hover:text-primary transition-colors",
                index === items.length - 1 ? "font-medium text-foreground pointer-events-none" : "text-muted-foreground"
              )}
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;


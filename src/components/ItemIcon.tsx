import * as React from 'react';
import { findCatalogItem } from '@/lib/items';
import { cn } from '@/lib/cn';

interface Props {
  name: string | null | undefined;
  /** lado em px (os GIFs do Tibia são 32×32) */
  size?: number;
  className?: string;
}

/** GIF do item (catálogo) ou uma caixinha neutra quando não há imagem. */
export function ItemIcon({ name, size = 32, className }: Props) {
  const item = findCatalogItem(name);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [item?.url]);

  const box = { width: size, height: size };
  if (!item || failed) {
    return (
      <span
        style={box}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-sm border border-dashed border-input bg-muted text-[9px] text-muted-foreground',
          className,
        )}
        title={name ?? undefined}
      >
        ?
      </span>
    );
  }
  return (
    <img
      src={item.url}
      alt={item.name}
      title={item.name}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ ...box, imageRendering: 'pixelated' }}
      className={cn('shrink-0', className)}
    />
  );
}

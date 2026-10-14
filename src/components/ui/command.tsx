'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';

import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

/** The cmdk root, on the shared rounded surface. */
const Command = React.forwardRef<React.ElementRef<typeof CommandPrimitive>, React.ComponentPropsWithoutRef<typeof CommandPrimitive>>(
  ({ className, ...props }, ref) => <CommandPrimitive ref={ref} className={cn('flex h-full w-full flex-col overflow-hidden', className)} {...props} />
);
Command.displayName = CommandPrimitive.displayName;

/**
 * The filter field. `CommandPrimitive.Input` already wires the type-ahead into cmdk's
 * list, so this only paints it — the surrounding icon and divider make it read as a
 * search box rather than a bare input.
 *
 * A text input always matches `:focus-visible`, so the site-wide focus ring from
 * `globals.css` would otherwise paint a white ring around this field (and its offset
 * shadow would bleed above the popover's top edge). That is cancelled for THIS input
 * alone — `outline-none` plus `ring-0`/`ring-offset-0` across focus, focus-visible and
 * active — so the field looks identical in every state. Other inputs keep their ring.
 */
const CommandInput = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Input>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center gap-2 border-b px-3" cmdk-input-wrapper="">
      <Search className="size-4 shrink-0 opacity-50" aria-hidden />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm shadow-none outline-none ring-0 ring-offset-0 placeholder:text-muted-foreground',
          'focus:shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0',
          'focus-visible:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
          'active:shadow-none active:outline-none active:ring-0 active:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<React.ElementRef<typeof CommandPrimitive.List>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>>(
  ({ className, ...props }, ref) => <CommandPrimitive.List ref={ref} className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)} {...props} />
);
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Empty>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>>(
  (props, ref) => <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm text-muted-foreground" {...props} />
);
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Group>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Group
      ref={ref}
      className={cn('overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground', className)}
      {...props}
    />
  )
);
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => <CommandPrimitive.Separator ref={ref} className={cn('-mx-1 h-px bg-border', className)} {...props} />);
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<React.ElementRef<typeof CommandPrimitive.Item>, React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        // `data-[selected=true]` is cmdk's roving-highlight, driven by arrow keys and
        // typing — it follows the writing direction without a special case.
        'relative flex cursor-default select-none items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        className
      )}
      {...props}
    />
  )
);
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ms-auto text-xs tracking-widest text-muted-foreground', className)} {...props} />
);
CommandShortcut.displayName = 'CommandShortcut';

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut };

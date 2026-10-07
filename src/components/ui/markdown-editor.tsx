'use client';

import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';

type MDEditorProps = {
  value: string;
  onChange: (value?: string) => void;
  height?: number;
  direction?: 'rtl' | 'ltr';
  textareaProps?: { placeholder?: string; dir?: string };
};

// The editor touches `window` on import, so it can never be part of a server render.
const MDEditor = dynamic<MDEditorProps>(() => import('@uiw/react-md-editor'), { ssr: false });

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** Required: the editor has no language of its own to fall back on. */
  placeholder: string;
  className?: string;
  height?: number;
};

/**
 * Markdown surface for the long-form body of a post, a project and a product.
 *
 * The library ships a Latin-only face, its own colour scheme and no notion of the
 * page's direction, so all three are imposed from here: the shell, the toolbar and the
 * preview mirror the site's theme and direction, and the typing face is inherited
 * rather than the editor's own (see `globals.css`).
 */
export default function MarkdownEditor({ value, onChange, placeholder, className, height = 400 }: MarkdownEditorProps) {
  const locale = useLocale();
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  const { theme, resolvedTheme } = useTheme();

  const colorMode = useMemo<'light' | 'dark'>(() => {
    const current = theme === 'system' ? resolvedTheme : theme;
    return current === 'dark' ? 'dark' : 'light';
  }, [theme, resolvedTheme]);

  return (
    <div className={cn('space-y-1', className)} dir={dir}>
      <div data-color-mode={colorMode} className="overflow-hidden rounded-lg border">
        <MDEditor value={value} onChange={next => onChange(next ?? '')} height={height} direction={dir} textareaProps={{ placeholder, dir }} />
      </div>
    </div>
  );
}

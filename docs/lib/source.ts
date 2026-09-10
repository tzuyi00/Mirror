import { docs, privateDocs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const privateSource = loader({
  baseUrl: '/private',
  source: privateDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getFlattenedPageTree(pathname: string, tree: ReturnType<typeof source.getPageTree>) {
  let targetTitle = '';
  if (pathname.startsWith('/docs/getting-started') || pathname.startsWith('/private/getting-started')) {
    targetTitle = 'Getting Started';
  } else if (pathname.startsWith('/docs/core-concepts') || pathname.startsWith('/private/core-concepts')) {
    targetTitle = 'Core Concepts';
  } else if (pathname.startsWith('/docs/api-reference') || pathname.startsWith('/private/api-reference')) {
    targetTitle = 'API Reference';
  }
  
  if (targetTitle) {
    const categoryNode = tree.children.find((child) => {
      if (child.type !== 'folder') return false;
      
      if (child.name) {
        const name = typeof child.name === 'string' ? child.name : String(child.name);
        const matched = name === targetTitle;
        
        // Debug log
        if (process.env.NODE_ENV === 'development') {
          console.log('[getFlattenedPageTree]', {
            pathname,
            targetTitle,
            childName: name,
            matched,
          });
        }
        
        return matched;
      }
      
      return false;
    });
    
    if (categoryNode && categoryNode.type === 'folder') {
      return {
        ...tree,
        children: categoryNode.children,
      };
    }
  }
  
  return tree;
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}

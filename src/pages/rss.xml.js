import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { postSlug } from '../data/internal-links';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Antonio Cumberbatch: Cloud Solutions Architect',
    description: 'Writing on cloud architecture, Azure, automation and integration, and the engineering behind real business systems.',
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      categories: [post.data.category, ...(post.data.tags ?? [])],
      link: `/blog/${postSlug(post)}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}

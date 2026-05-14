import matter from 'gray-matter';

export interface FrontmatterResult<T = Record<string, unknown>> {
  data: T;
  content: string;
}

export function parseFrontmatter<T = Record<string, unknown>>(
  source: string,
): FrontmatterResult<T> {
  const { data, content } = matter(source);
  return { data: data as T, content };
}

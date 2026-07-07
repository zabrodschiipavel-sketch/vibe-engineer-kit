// Возвращает топ-N тегов по популярности.
export function topTags(tags, n) {
  return tags.sort((a, b) => b.count - a.count).slice(0, n);
}

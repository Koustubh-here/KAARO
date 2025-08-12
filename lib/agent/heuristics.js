export function isExplicitDetailUpdate(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    /\b(my name is|i am|call me)\b/,
    /\b(my (shop|store|business|company)( name)? is|call my (shop|store|business|company))\b/,
    /\b(my phone( number)? is|phone is|contact number is)\b/,
    /\b(my email is|email is)\b/,
    /\b(my address is|address is|located at)\b/,
    /\b(set|update)\s+my\s+(name|business|shop|store|company|phone|email|address)\b/,
    /\bremember\b.*\b(this|that|it)\b/, // "remember this"
    /\bmy\s+[a-z0-9 _-]+\s+is\s+[^.,;!?]+/, // generic pattern "my X is Y"
  ];
  return patterns.some(re => re.test(t));
}

export function extractKeyValueFromText(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();
  // Examples: "my favorite color is red", "my phone number is 12345"
  const match = t.match(/\bmy\s+([a-z0-9 _-]+?)\s+is\s+([^.,;!?]+)(?:[.,;!?]|$)/i);
  if (!match) return null;
  const rawKey = match[1].trim();
  const rawValue = match[2].trim();
  const key = rawKey
    .replace(/\bfavourite\b/g, 'favorite')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
  const value = rawValue.replace(/\s+$/, '');
  if (!key || !value) return null;
  return { key, value };
}



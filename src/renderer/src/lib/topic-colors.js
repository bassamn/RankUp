export const topicPalette = [
  "#c7f540",
  "#8b5cf6",
  "#32c5ff",
  "#ff8f5c",
  "#f0529c",
  "#43d6a3"
];

function topicIdentity(topicOrId) {
  if (topicOrId && typeof topicOrId === "object") {
    return topicOrId.id
      ?? topicOrId.topic_id
      ?? topicOrId.name
      ?? topicOrId.topic_name
      ?? "";
  }
  return topicOrId ?? "";
}

function stableStringHash(value) {
  let hash = 2166136261;
  for (const character of String(value).trim().toLowerCase()) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getTopicColor(topicOrId) {
  const identity = topicIdentity(topicOrId);
  const numericId = Number(identity);
  const paletteIndex = Number.isSafeInteger(numericId) && numericId > 0
    ? (numericId - 1) % topicPalette.length
    : stableStringHash(identity) % topicPalette.length;
  return topicPalette[paletteIndex];
}

export function topicColorWithAlpha(topicOrId, alpha = 1) {
  const color = getTopicColor(topicOrId);
  const boundedAlpha = Math.min(1, Math.max(0, Number(alpha) || 0));
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${boundedAlpha})`;
}

export function getTopicContrastColor(topicOrId) {
  const color = getTopicColor(topicOrId);
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.42 ? "#11140c" : "#ffffff";
}

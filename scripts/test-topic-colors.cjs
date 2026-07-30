const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function run() {
  const source = fs.readFileSync(
    path.join(__dirname, "../src/renderer/src/lib/topic-colors.js"),
    "utf8"
  );
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const {
    getTopicColor,
    getTopicContrastColor,
    topicColorWithAlpha,
    topicPalette
  } = await import(moduleUrl);

  const cardTopic = { id: 7, name: "Tiile" };
  const dailyRow = { topic_id: 7, topic_name: "Tiile" };
  const breakdownRow = { topic_id: 7, topic_name: "Tiile" };
  assert.equal(getTopicColor(cardTopic), getTopicColor(dailyRow));
  assert.equal(getTopicColor(cardTopic), getTopicColor(breakdownRow));

  const topics = [{ id: 2 }, { id: 7 }, { id: 4 }, { id: 11 }];
  const originalColors = new Map(topics.map((topic) => [topic.id, getTopicColor(topic)]));
  for (const topic of [...topics].reverse()) {
    assert.equal(getTopicColor(topic), originalColors.get(topic.id));
  }

  assert.equal(getTopicColor({ id: 1 }), topicPalette[0]);
  assert.match(topicColorWithAlpha({ id: 1 }, 0.08), /^rgba\(\d+, \d+, \d+, 0\.08\)$/);
  assert.ok(["#11140c", "#ffffff"].includes(getTopicContrastColor({ id: 1 })));
  console.log("Topic color mapping remains stable across cards and reordered chart data.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

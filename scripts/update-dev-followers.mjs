import { mkdir, readFile, writeFile } from "node:fs/promises";

const apiKey = process.env.DEVTO_API_KEY;

if (!apiKey) {
  throw new Error("DEVTO_API_KEY is required.");
}

const perPage = 1000;
let page = 1;
let followerCount = 0;

while (true) {
  const url = new URL("https://dev.to/api/followers/users");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(perPage));

  const response = await fetch(url, {
    headers: {
      "api-key": apiKey,
      Accept: "application/vnd.forem.api-v1+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch DEV followers: ${response.status} ${response.statusText}`,
    );
  }

  const followers = await response.json();

  if (!Array.isArray(followers)) {
    throw new Error("Unexpected response from the DEV followers API.");
  }

  followerCount += followers.length;

  if (followers.length < perPage) {
    break;
  }

  page += 1;
}

const formattedCount = followerCount.toLocaleString("en-US");
const followerLabel = followerCount === 1 ? "follower" : "followers";
const label = `DEV.to  ·  ${formattedCount} ${followerLabel}`;

const height = 36;
const step = 3;
const horizontalPadding = 18;
const approximateCharacterWidth = 7.2;
const width = Math.max(
  160,
  Math.ceil(label.length * approximateCharacterWidth + horizontalPadding * 2),
);

const shellPoints = [
  [step * 3, 0],
  [width - step * 3, 0],
  [width - step * 3, step],
  [width - step * 2, step],
  [width - step * 2, step * 2],
  [width - step, step * 2],
  [width - step, height - step * 2],
  [width - step * 2, height - step * 2],
  [width - step * 2, height - step],
  [width - step * 3, height - step],
  [width - step * 3, height],
  [step * 3, height],
  [step * 3, height - step],
  [step * 2, height - step],
  [step * 2, height - step * 2],
  [step, height - step * 2],
  [step, step * 2],
  [step * 2, step * 2],
  [step * 2, step],
  [step * 3, step],
]
  .map(([x, y]) => `${x},${y}`)
  .join(" ");

const fillPoints = [
  [step * 3, step],
  [width - step * 3, step],
  [width - step * 3, step * 2],
  [width - step * 2, step * 2],
  [width - step * 2, height - step * 2],
  [width - step * 3, height - step * 2],
  [width - step * 3, height - step],
  [step * 3, height - step],
  [step * 3, height - step * 2],
  [step * 2, height - step * 2],
  [step * 2, step * 2],
  [step * 3, step * 2],
]
  .map(([x, y]) => `${x},${y}`)
  .join(" ");

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">
  <title>${escapeXml(label)}</title>
  <polygon points="${shellPoints}" fill="#7caa4a" shape-rendering="crispEdges"/>
  <polygon points="${fillPoints}" fill="#000000" shape-rendering="crispEdges"/>
  <text
    x="${width / 2}"
    y="${height / 2 + 0.5}"
    fill="#7caa4a"
    font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
    font-size="13"
    font-weight="700"
    text-anchor="middle"
    dominant-baseline="middle"
  >${escapeXml(label)}</text>
</svg>
`;

const outputPath = "assets/dev-followers.svg";
const readmePath = "README.md";

await mkdir("assets", { recursive: true });

let currentSvg = "";

try {
  currentSvg = await readFile(outputPath, "utf8");
} catch {
  // The asset will be created on the first run.
}

if (currentSvg !== svg) {
  await writeFile(outputPath, svg);
  console.log(`Updated DEV follower badge to ${formattedCount}.`);
} else {
  console.log("DEV follower badge is already up to date.");
}

const readme = await readFile(readmePath, "utf8");
const badgeSourcePattern =
  /(\.\/assets\/dev-followers\.svg)(?:\?v=\d+)?/;
const versionedBadgeSource =
  `./assets/dev-followers.svg?v=${followerCount}`;

if (!badgeSourcePattern.test(readme)) {
  throw new Error("DEV follower badge reference was not found in README.md.");
}

const nextReadme = readme.replace(
  badgeSourcePattern,
  versionedBadgeSource,
);

if (nextReadme !== readme) {
  await writeFile(readmePath, nextReadme);
  console.log(`Updated README badge version to ${followerCount}.`);
} else {
  console.log("README badge version is already up to date.");
}

import { readFile, writeFile } from "node:fs/promises";

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

const startMarker = "<!-- DEV-FOLLOWERS-BADGE:START -->";
const endMarker = "<!-- DEV-FOLLOWERS-BADGE:END -->";
const readmePath = "README.md";
const readme = await readFile(readmePath, "utf8");

const formattedCount = followerCount.toLocaleString("en-US");
const followerLabel = followerCount === 1 ? "follower" : "followers";
const message = encodeURIComponent(`${formattedCount} ${followerLabel}`);
const badgeUrl =
  `https://img.shields.io/badge/DEV.to-${message}-0A0A0A?style=for-the-badge&logo=devdotto&logoColor=white`;

const badgeBlock = `${startMarker}
<a href="https://dev.to/nyaomaru">
  <img height="36" alt="DEV follower count" src="${badgeUrl}" />
</a>
${endMarker}`;

const badgePattern = new RegExp(
  `${startMarker}[\\s\\S]*?${endMarker}`,
);

if (!badgePattern.test(readme)) {
  throw new Error("DEV followers badge markers were not found in README.md.");
}

const nextReadme = readme.replace(badgePattern, badgeBlock);

if (nextReadme !== readme) {
  await writeFile(readmePath, nextReadme);
  console.log(`Updated DEV follower count to ${formattedCount}.`);
} else {
  console.log("DEV follower count is already up to date.");
}

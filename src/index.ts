/**
 * Entry point: GET → solve → POST using my unique URL.
 * All HTTP I/O is here
 */

import { ApiInput, GroupStats } from "./types";
import { solve } from "./solve";

// GET the challenge data from the unique URL
async function fetchInput(url: string): Promise<ApiInput> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`GET failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ApiInput;
}

// POST the result back. Print the response body
// if 400 then the server tells us what went wrong, useful debugging
async function submitResult(url: string, result: GroupStats[]): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  const body = await res.text();
  console.log(`POST status: ${res.status} ${res.statusText}`);
  if (body) console.log(`Response body: ${body}`);

  if (!res.ok) {
    throw new Error(`POST failed: ${res.status}`);
  }
}

// allow URL via command line arg OR env var 
// (env var is nice for not putting the unique URL in shell history)
async function main(): Promise<void> {
  const url = process.argv[2] ?? process.env.CARPOOL_URL;
  if (!url) {
    throw new Error(
      "No URL provided. Pass it as the first argument or set CARPOOL_URL.",
    );
  }

  console.log(`Fetching input from ${url} ...`);
  const input = await fetchInput(url);
  console.log(
    `Got ${input.users.length} users, ${input.requests.length} requests.`,
  );

  const result = solve(input);
  console.log(`Computed ${result.length} groups.`);
  console.log("Result preview:");
  console.log(JSON.stringify(result, null, 2));

  console.log(`\nSubmitting result to ${url} ...`);
  await submitResult(url, result);
}

// top-level catch so any error gets printed cleanly + exits with code 1
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");

function envValue(name) {
  const line = env
    .split("\n")
    .find((line) => line.startsWith(`${name}=`));

  return line
    ?.slice(name.length + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");
}

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const key = envValue("SUPABASE_SECRET_KEY");

if (!url || !key) {
  console.error("Supabase URL au secret key haijapatikana.");
  process.exit(1);
}

const response = await fetch(
  `${url}/rest/v1/farm_plan_items?select=id,title,planned_date,is_completed&order=planned_date.asc`,
  {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }
);

const text = await response.text();

console.log(`HTTP: ${response.status}`);

if (!response.ok) {
  console.log(text);
  process.exit(1);
}

const data = JSON.parse(text);

console.log(JSON.stringify(data, null, 2));

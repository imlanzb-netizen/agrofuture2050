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

async function inspectTable(table) {
  const response = await fetch(
    `${url}/rest/v1/${table}?select=*&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    }
  );

  const text = await response.text();

  console.log(`\n=== ${table} ===`);
  console.log(`HTTP: ${response.status}`);

  if (!response.ok) {
    console.log(text);
    return;
  }

  const data = JSON.parse(text);

  if (!Array.isArray(data) || data.length === 0) {
    console.log("Table haina rows bado.");
    return;
  }

  console.log("Columns:");
  for (const column of Object.keys(data[0])) {
    console.log(`- ${column}`);
  }
}

await inspectTable("farm_plans");
await inspectTable("farm_plan_items");
await inspectTable("user_alerts");

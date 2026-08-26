import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");

function envValue(name) {
  const line = env.split("\n").find((line) => line.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
}

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const key = envValue("SUPABASE_SECRET_KEY");

const response = await fetch(
  `${url}/rest/v1/farm_plan_items`,
  {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      farm_plan_id: "25c2bfdc-df2a-41a3-851e-cf8ce6cc7630",
      title: "TEST REMINDER - Ondoa baada ya test",
      description: "Hii ni reminder ya majaribio tu.",
      item_type: "activity",
      planned_date: "2026-08-23",
      quantity: 1,
      unit: "test",
      unit_cost: 0,
      is_completed: false
    }),
  }
);

console.log("HTTP:", response.status);
console.log(JSON.stringify(await response.json(), null, 2));

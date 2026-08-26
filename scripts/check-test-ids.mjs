import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");

function envValue(name) {
  const line = env.split("\n").find((line) => line.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
}

const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
const key = envValue("SUPABASE_SECRET_KEY");

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

const response = await fetch(
  `${url}/rest/v1/farm_plans?select=id,user_id,name&limit=10`,
  { headers }
);

console.log("HTTP:", response.status);
console.log(JSON.stringify(await response.json(), null, 2));

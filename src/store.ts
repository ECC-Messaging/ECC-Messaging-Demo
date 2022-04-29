import { asyncable } from "svelte-asyncable";
import * as ecc_math from "simple-js-ec-math";

export const users = asyncable(fetchUsers, null);
async function fetchUsers() {
  const res = await fetch(
    `https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/users`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
  const json = await res.json();
  return json;
}

export const serverKey = asyncable(fetchKeys, null);
async function fetchKeys() {
  const res = await fetch(
    `https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/serverkey`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  let json = await res.json();
  let point = new ecc_math.ModPoint(eval(json.x), eval(json.y));
  return point;
}

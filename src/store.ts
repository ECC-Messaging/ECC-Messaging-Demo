import { asyncable } from "svelte-asyncable";
import * as ecc_math from "simple-js-ec-math";

export const users = asyncable(fetchUsers, null);
async function fetchUsers() {
  const res = await fetch(
    `https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/users`,
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
    `https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/serverkey`,
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

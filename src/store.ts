import { asyncable } from "svelte-asyncable";

export const user = asyncable(fetchUsers, null);
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
  if (res.ok) {
    setTimeout(() => {
      return json;
    }, 0 * Math.random());
  } else {
    throw new Error("whoops");
  }
  return await res.json();
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
  return await res.json();
}

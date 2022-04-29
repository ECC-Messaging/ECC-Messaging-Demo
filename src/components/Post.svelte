<script lang="ts">
	import Cookies from "js-cookie";
    import Time from "svelte-time";
	import ECCM from 'ecc-messaging-scheme-package';
	import { users } from '../store.js';
	import { serverKey } from '../store.js';
    import * as ecc_math from "simple-js-ec-math";

	export let message: string;
    export let time: string;
    export let postOwnerID: string;
    const uuid: string = Cookies.get("uuid_ecc");

    let postEncrypted = true;

    async function decryptMessage() {
        const usersObject = await users.get();
        const user = usersObject[uuid];

        if (usersObject !== undefined && user !== undefined) {
            
            if (uuid === postOwnerID) {
                let key = await serverKey.get();
                const uuidECC = new ECCM(uuid);
                uuidECC.generateSharedKey(key);
                postEncrypted = false;
                return uuidECC.decrypt(message);
            } else if (user.friends.includes(postOwnerID)) {
                const jsonK = usersObject[postOwnerID].shared;
                let key = new ecc_math.ModPoint(eval(jsonK.x), eval(jsonK.y));
                const uuidECC = new ECCM("");
                postEncrypted = false;
                return uuidECC.decryptWKey(key['x'], message);
            }

            return "Unable to decrypt this message, request access from post owner to view.";
        }
    }

    async function requestAccess() {
        const usersObject = await users.get();
        const user = usersObject[uuid];

		if (usersObject !== undefined && user !== undefined) {
            const res = await
                fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/users`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        [uuid]:
                        {
                            friends: [
                                postOwnerID
                            ]
                        }
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            if (res.ok) {
                location.reload(true);
            } else {
                throw new Error("Whoops, could not request friend access.");
            }
		}
    }

    let decryptPromise = decryptMessage();
</script>


<blockquote>
    {#await decryptPromise then decryptedMessage}
        <h4>{decryptedMessage}</h4>
        <div class="post-footer">
            <Time timestamp="{time}" format="MMMM D, YYYY @ h:mm a" />
            {#if postEncrypted}
                <button on:click|once={requestAccess}>Request Access</button>
            {/if}
        </div>
    {/await}
</blockquote>

<style>
    .post-footer {
        display: flex;
        justify-content: space-evenly;
    }
</style>

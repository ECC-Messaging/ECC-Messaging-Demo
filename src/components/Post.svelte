<script lang="ts">
	import Cookies from "js-cookie";
    import Time from "svelte-time";
	import ECCM from 'ecc-messaging-scheme-package';
    import * as ecc_math from "simple-js-ec-math";

	export let message: string;
    export let time: string;
    export let postOwnerID: string;
    export let usersObject: JSON;
    const uuid: string = Cookies.get("uuid_ecc");

    let postEncrypted = true;

    async function decryptMessage() {
        const user = usersObject[uuid];

        if (usersObject !== undefined && user !== undefined) {

            if (uuid === postOwnerID) {
                const jsonK = usersObject[postOwnerID].shared;
                let key = new ecc_math.ModPoint(eval(jsonK.x), eval(jsonK.y));
                const uuidECC = new ECCM("");
                postEncrypted = false;
                return uuidECC.decryptWKey(key['x'], message);
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
        const user = usersObject[uuid];

		if (usersObject !== undefined && user !== undefined) {
            const res = await
                fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/users`,
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
        <div class="horizontal-flex">
            <h4>{decryptedMessage}</h4>
            {#if postEncrypted}
                <button on:click|once={requestAccess}>Request Access</button>
            {/if}
        </div>
        <div class="horizontal-flex">
            <p>{postOwnerID}</p>
            <Time timestamp="{time}" format="MMMM D, YYYY @ h:mm a" />
        </div>
    {/await}
</blockquote>

<style>
    .horizontal-flex {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
    }   
</style>

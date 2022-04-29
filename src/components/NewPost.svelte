<script lang="ts">
	import ECCM from 'ecc-messaging-scheme-package';
	import { serverKey } from '../store.js';
	import { users } from '../store.js';
	import Cookies from "js-cookie";
    const uuid: string = Cookies.get("uuid_ecc");


    let message = '';

    async function updateBasket(message: string, uuid: string) {
		const res = await
        fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/messages`,
			{
				method: 'PUT',
                body: JSON.stringify({
                    posts: [
                        {
                            message: message,
                            timestamp: Date.now(),
                            ownerID: Cookies.get("uuid_ecc")
                        }
                    ]
                }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
		if (res.ok) {
			location.reload(true);
		} else {
            throw new Error("Whoops, something went wrong with your post!");
        }
	}

    async function getUser() {
        return await users.get();
    }

    async function handlePost() {
        const key = await serverKey.get();
        const uuidECC = new ECCM(uuid);
        uuidECC.generateSharedKey(key);

        const encryptedMessage = uuidECC.encrypt(message);
        await updateBasket(encryptedMessage, uuid);
	}

    let userPromise = getUser();
</script>

{#await userPromise then user}
    {#if user !== null}
        <input bind:value={message} placeholder="enter your message" style="height: 50px; width: 588px;"/>
        <button on:click={handlePost}>
            Post Message
        </button>
    {/if}
{/await}

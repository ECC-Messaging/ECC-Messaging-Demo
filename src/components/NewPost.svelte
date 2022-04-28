<script lang="ts">
	import ECCM from 'ecc-messaging-scheme-package';
	import { serverKey } from '../store.js';
	import { user } from '../store.js';

    let message = '';

    async function updateBasket(message: string, uuid: string) {
		const res = await 
        fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/messages`, 
			{
				method: 'GET',
                body: JSON.stringify({ 
                    posts: [
                        {
                            message: message,
                            timestamp: Date.now(),
                            ownerID: uuid
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
        return await user.get();
    }

    async function handlePost() {
        const userObject = await user.get();
        const key = await serverKey.get();
        const uuidECC = new ECCM(userObject.uuid);
        uuidECC.generateSharedKey(key);
        
        const encryptedMessage = uuidECC.encrypt(message);
        await updateBasket(encryptedMessage, userObject.uuid);
	}

    let userPromise = getUser();
</script>

{#await userPromise then user}
    {#if user !== null}
        <input bind:value={message} placeholder="enter your message" style="height: 50px; width: 588px;"/>
        <button on:click|once={handlePost}>
            Post Message
        </button>
    {/if}
{/await}

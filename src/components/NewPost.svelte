<script lang="ts">
	import ECCM from 'ecc-messaging-scheme-package';
	import { serverKey } from '../store.js';
	import Cookies from "js-cookie";

    export let posts;
    let message = '';

    async function updateBasket(message: string, uuid: string) {
        const post = { message: message, timestamp: Date.now(), ownerID: uuid };

		const res = await
		        fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/messages`,
			{

				method: 'PUT',
                body: JSON.stringify({
                    posts: [post]
                }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
		if (res.ok) {
            posts.reverse();
			posts = [...posts, post];
		} else {
            throw new Error("Whoops, something went wrong with your post!");
        }
	}
    
    async function handlePost() {
		const uuid = Cookies.get("uuid_ecc")
        const key:string = await serverKey.get();
        const uuidECC = new ECCM(uuid);
		uuidECC.ECC.loadPublicKey();

        uuidECC.generateSharedKey(key);
		uuidECC.ECC.generateSharedKey(key);

        const encryptedMessage = uuidECC.encrypt(message);
        await updateBasket(encryptedMessage, uuid);
	}
</script>

<input bind:value={message} placeholder="enter your message" style="height: 50px; width: 588px;"/>
<button on:click={handlePost}>
    Post Message
</button>

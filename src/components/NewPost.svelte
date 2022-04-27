<script lang="ts">
    import { now } from "svelte/internal";
	const ecc = require('ecc-messaging-scheme-package');
    let message = '';

    async function updateBasket(message: string) {				
		const res = await 
        fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/messages`, 
			{
				method: 'PUT',
                body: JSON.stringify({
                    message: message,
                    timestamp: now()
                }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
		if (!res.ok) {
			throw new Error();
		}
	}
	

    async function handlePost() {
        ecc.generateSharedKey(process.env.ECC_PRIVATE_KEY);
        let encryptedMessage = ecc.encyrpt(message);

        await updateBasket(encryptedMessage);
	}
</script>

<input bind:value={message} placeholder="enter your message">
<button on:click|once={handlePost}>
    Post Message
</button>
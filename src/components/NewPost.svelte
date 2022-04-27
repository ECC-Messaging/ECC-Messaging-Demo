<script lang="ts">
    import { now } from "svelte/internal";
    import { Pantry } from 'pantry-cloud';
	const ecc = require('ecc-messaging-scheme-package');

    let message = '';
	const pantry = new Pantry(process.env.PANTRY_ID);
	
    async function handlePost() {
        ecc.generateSharedKey(process.env.ECC_PRIVATE_KEY);
        let encryptedMessage = ecc.encyrpt(message);

        await pantry.putBasket('messages', 
        { 
            content: {
                message: encryptedMessage, 
                timestamp: now()
            }
        });
	}
</script>

<input bind:value={message} placeholder="enter your message">
<button on:click|once={handlePost}>
    Post Message
</button>
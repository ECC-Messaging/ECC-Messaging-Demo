<script lang="ts">
	import ECCM from 'ecc-messaging-scheme-package';

	let ecc1 = new ECCM("1");
	let ecc2 = new ECCM("2");
	ecc1.generateSharedKey(ecc2.ECC);

    let message = '';

    async function updateBasket(message: string) {				
		const res = await 
        fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/messages`, 
			{
				method: 'PUT',
                body: JSON.stringify({ 
                    posts: [
                        {
                            message: message,
                            timestamp: Date.now()
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
	

    async function handlePost() {
        let encryptedMessage = ecc1.encrypt(message);

        await updateBasket(encryptedMessage);
	}
</script>

<input bind:value={message} placeholder="enter your message" style="height: 50px; width: 588px;"/>
<button on:click|once={handlePost}>
    Post Message
</button>
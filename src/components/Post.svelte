<script lang="ts">
    import Time from "svelte-time";
	import ECCM from 'ecc-messaging-scheme-package';
	import { user } from '../store.js';
	import { serverKey } from '../store.js';

	export let message: string;
    export let time: string;
    export let postOwnerID: string;

    let postEncrypted = true;

    async function decryptMessage() {
        const userObject = await user.get();
        
        if (userObject) {
            if (userObject.uuid === postOwnerID) {

                const key = await serverKey.get();
                const uuidECC = new ECCM(userObject.uuid);
                uuidECC.generateSharedKey(key);
                postEncrypted = false;
                return uuidECC.decrypt(message);
            } else {
                if (userObject.friends[postOwnerID]) {
                    const key = userObject.friends[postOwnerID];
                    const uuidECC = new ECCM(userObject.uuid);
                    uuidECC.generateSharedKey(key);
                    postEncrypted = false;
                    return uuidECC.decrypt(message);
                }
            }
            return "Unable to decrypt this message, request access from post owner to view.";
        }
    }

    async function requestAccess() {
        const userObject = await user.get();

        const friendRes = await 
			fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/users`, 
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});
		const json = await friendRes.json();
		if (friendRes.ok) {
			async () => {
                const uuid: string = userObject.uuid;
				let friendkey: string = json[postOwnerID].pub;

                const res = await 
                fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/users`, 
                    {
                        method: 'PUT',
                        body: JSON.stringify({ 
                            [uuid]:
                            {
                                friends: {
                                    postOwnerID: friendkey
                                }
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

				return true;
			}
		} else {
			throw new Error("Whoops, could not get friend key.");
		}
    }

    let decryptPromise = decryptMessage();
    let friendPromise = null;

    function tryFriendship() {
        friendPromise = requestAccess();
    }
</script>


<blockquote>
    {#await decryptPromise then decryptedMessage}
            <h4>{decryptedMessage}</h4>
            <div>
                <Time timestamp="{time}" format="MMMM D, YYYY @ h:mm a" />
                {#if postEncrypted}
                    <button on:click={tryFriendship}>Request Access</button>
                {/if}
                {#if friendPromise !== null}
                    {#await friendPromise}
                        <p>Trying to become friends...</p>
                    {/await}
                {/if}
            </div>
    {:catch error}
        <p style="color: red">{error}</p>
    {/await}
</blockquote>

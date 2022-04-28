<script lang="ts">
	import ECCM from 'ecc-messaging-scheme-package';
	import Post from "./components/Post.svelte";
	import NewPost from "./components/NewPost.svelte";
	import Spinner from "./components/Spinner.svelte";
	import Cookies from "js-cookie";
	import { serverKey } from './store.js';	

	
	let posts = [];
    let uuid: string;
	let cookieID = Cookies.get("uuid_ecc");

	async function getBasket() {				
		const res = await 
			fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/messages`, 
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			});
		const json = await res.json();
		if (res.ok) {
			setTimeout(() => {
				posts = json.posts;

				return true;
			}, 0 * Math.random())
		} else {
			throw new Error("whoops");
		}
	}

	let promise = getBasket();

    async function generateSharedKeyWithUser() {
        const key = await serverKey.get();
        const uuidECC = new ECCM(uuid);
        uuidECC.generateSharedKey(key);
		return uuidECC;
    }

    async function handleLogin() {
        if (Cookies.get("uuid_ecc") === undefined) {
			let eccInstance = await generateSharedKeyWithUser();
			let key = eccInstance.ECC.getPublicKey();
			const res = await
				fetch(`https://getpantry.cloud/apiv1/pantry/3140d297-fd8e-4581-90f9-c879e38e26dd/basket/users`,
				{
					method: 'PUT',
					body: JSON.stringify({
						[uuid]: {
							pub: {x: `${key['x']}n`, y:`${key['y']}n`},
							friends: [
								
							]
						}
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				});
			if (res.ok) {
				Cookies.set("uuid_ecc", uuid, { expires: 365 });
				location.reload(true);
			} else {
				throw new Error("Whoops, could not login!");
			}

		}
    }
</script>

<main>
	{#if cookieID === undefined}
		<h5>Login to post</h5>
		<input bind:value={uuid} placeholder="enter your username" style="height: 50px; width: 588px;"/>
		<button on:click|once={handleLogin}>
			Sign in
		</button>
	{:else}
		<NewPost />

		{#await promise}
			<Spinner/>
		{:then}
			{#each posts.reverse() as post}
				<Post message={post.message} time={post.timestamp} postOwnerID={post.ownerID}/>
			{/each}
		{:catch error}
			<p style="color: red">{error}</p>
		{/await}
	{/if}
</main>

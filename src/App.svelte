<script lang="ts">
	import ECCM from 'ecc-messaging-scheme-package';
	import Post from "./components/Post.svelte";
	import NewPost from "./components/NewPost.svelte";
	import Spinner from "./components/Spinner.svelte";
	import Cookies from "js-cookie";
	import { serverKey, users } from './store.js';


	let posts = [];
    let uuid: string;
	let cookieID = Cookies.get("uuid_ecc");
	let usersObject;

	async function getBasket() {
		usersObject = await users.get();
		const res = await
			fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/messages`,
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
			let key = eccInstance.ECC.getSharedKey();
			const res = await
				fetch(`https://getpantry.cloud/apiv1/pantry/149eae50-eb1c-4667-9524-532c4e4afc62/basket/users`,
				{
					method: 'PUT',
					body: JSON.stringify({
						[uuid]: {
							shared: {x: `${key['x']}n`, y:`${key['y']}n`},
							friends: [

							]
						}
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				});
			if (res.ok) {
				cookieID = uuid;
				Cookies.set("uuid_ecc", uuid, { expires: 365 });
			} else {
				throw new Error("Whoops, could not login!");
			}

		}
    }
</script>

<main>
	{#key cookieID}
		{#if cookieID === undefined}
			<h5>Login to post</h5>
			<input bind:value={uuid} placeholder="enter your username" style="height: 50px; width: 588px;"/>
			<button on:click|once={handleLogin}>
				Sign in
			</button>
		{:else}
			<NewPost bind:posts={posts} />
			{#key posts}
				{#await promise}
					<Spinner/>
				{:then}
					{#each posts.reverse() as post}
						<Post message={post.message} time={post.timestamp} postOwnerID={post.ownerID} {usersObject}/>
					{/each}
				{:catch error}
					<p style="color: red">{error}</p>
				{/await}
			{/key}
		{/if}
	{/key}
</main>

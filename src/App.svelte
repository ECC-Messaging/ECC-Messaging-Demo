<script lang="ts">
	import Post from "./components/Post.svelte";
	import NewPost from "./components/NewPost.svelte";
	import Spinner from "./components/Spinner.svelte";
	import Nav from "./components/Nav.svelte";
	
	let posts = [];

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
</script>


<header>
	<Nav />
</header>
<main>
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
</main>

<script lang="ts">
import { get } from "svelte/store";

	import Post from "./components/Post.svelte";
	import Spinner from "./components/Spinner.svelte";
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
				posts = json;			
				
				return true;
			}, 0 * Math.random())
		} else {
			throw new Error("whoops");
		}
	}

	let promise = getBasket();
</script>

{#await promise}
	<Spinner/>
{:then basket}
	<p>{basket}</p>
	<!-- {#each posts as post}
		<Post message={post.message} time={post.timestamp}/>
	{/each} -->
{:catch error}
	<p style="color: red">{error}</p>
{/await}
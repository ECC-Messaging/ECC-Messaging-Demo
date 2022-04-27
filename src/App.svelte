<script lang="ts">
	import Post from "./components/Post.svelte";
	import Spinner from "./components/Spinner.svelte";
	import { Pantry } from 'pantry-cloud';
	const pantry = new Pantry("3140d297-fd8e-4581-90f9-c879e38e26dd");


	async function getBasket() {
		return await pantry.getBasket('messages');
	}
	const promise = getBasket;
</script>

{#await promise}
	<Spinner/>
{:then basket}
<p>{basket}</p>
	<!-- {#each basket as message}
		<Post message={message.message} time={messages.timestamp}/>
	{/each} -->
{:catch error}
	<p style="color: red">{error}</p>
{/await}
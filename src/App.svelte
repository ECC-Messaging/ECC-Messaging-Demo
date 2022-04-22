<script lang="ts">
	export let name: string;
	const pantry = require('pantry-node')
</script>

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<script>
	import Spinner from './spinner.svelte';
		
	let posts = [];
	let pID = "3140d297-fd8e-4581-90f9-c879e38e26dd";


	async function getPosts(){				
		const res = await 
			fetch(`https://getpantry.cloud/apiv1/pantry/${pID}/basket/messages`);
		const json = await res.json();

		if (res.ok) {
			setTimeout(() => {
				posts = json;				
				//grab column names
				colNames = Object.keys(posts[0])
				
				return true;
			}, 0 * Math.random())
			
		} else {
			throw new Error(text);
		}
	}
	
	
	let promise = getPosts();

	function reload(newSource){
		sourceJson = newSource
		promise = getPosts();
	}
	
	let sortBy = {col: "name", ascending: true};
	
	$: sort = (column) => {
		
		if (sortBy.col == column) {
			sortBy.ascending = !sortBy.ascending
		} else {
			sortBy.col = column
			sortBy.ascending = true
		}
		
		// Modifier to sorting function for ascending or descending
		let sortModifier = (sortBy.ascending) ? 1 : -1;
		
		let sort = (a, b) => 
			(a[column] < b[column]) 
			? -1 * sortModifier 
			: (a[column] > b[column]) 
			? 1 * sortModifier 
			: 0;
		
		things = things.sort(sort);
	}
	
</script>

<button on:click={reload(sourceJson)}>Reload</button>

<select on:change={() => reload(document.getElementById('jsonSelector').value)} id="jsonSelector">
	<option value="users">Users</option>
	<option value="photos">Photos</option>
	<option value="comments">Comments</option>
</select>

{#await promise}
	<Spinner/>
{:then getPosts}

<table>
	<thead>
	<tr>
		{#each colNames as col}
	<th on:click={sort(col)}>{col} &varr;</th>
{/each}
	</tr>
	</thead>
	<tbody>
		
		{#each things as thing, index (thing.id)}

		<tr>
			{#each colNames as col, index}
			<td>{thing[col]}</td>
			{/each}
		</tr>
		{/each}
	
	</tbody>
</table>



{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

<style>
	
</style>

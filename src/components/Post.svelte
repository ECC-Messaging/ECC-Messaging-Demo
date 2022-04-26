<script lang="ts">
    import Time from "svelte-time";

	export let message: string;
    export let time: string;
    export let id: number;
</script>

<article class="post-container">
	<h4 class="post-body">{message}</h4>
    <div class="post-footer">
        <Time timestamp="{time}" format="MMMM D, YYYY @ h:mm a" />
        <p>{id}</p>
    </div>
</article>

<style>
    .post-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        background-color: aliceblue;
        border-radius: 5px;
        box-shadow: 2px;
        padding: 5px;
    }

    .post-body {
        background-color: rgba(0, 0, 0, .15);
        border-radius: 4px;
    }

    .post-footer {
        display: flex;
        justify-content: space-around;
        align-items: center;
    }

    .post-footer > * {
        font-style: italic;
        font-size: small;
    }
</style>
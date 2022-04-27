<script lang="ts">
    import Time from "svelte-time";
	import ECCM from 'ecc-messaging-scheme-package';

	export let message: string;
    export let time: string;

    let ecc1 = new ECCM("1");
	let ecc2 = new ECCM("2");
	ecc1.generateSharedKey(ecc2.ECC);
	
    let decryptedMessage = ecc1.decrypt(message);
</script>

<article class="post-container">
	<h4 class="post-body">{decryptedMessage}</h4>
    <div class="post-footer">
        <Time timestamp="{time}" format="MMMM D, YYYY @ h:mm a" />
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
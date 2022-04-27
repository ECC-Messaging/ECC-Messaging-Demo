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

<blockquote>
	<h4>{decryptedMessage}</h4>
    <Time timestamp="{time}" format="MMMM D, YYYY @ h:mm a" />
</blockquote>

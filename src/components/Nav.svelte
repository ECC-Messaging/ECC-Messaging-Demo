<script lang="ts">
    import ECCM from 'ecc-messaging-scheme-package';
	import { serverKey } from '../store.js';
	import { user } from '../store.js';

    let uuid: string;
    let password: string;

    async function handleLogin() {
        await generateSharedKeyWithUser();
    }

    function handleSignup() {

    }

    async function generateSharedKeyWithUser() {
        const key = await serverKey.get();
        const uuidECC = new ECCM(uuid);
        return uuidECC.generateSharedKey(key);
    }
</script>

<nav>
  <a on:click={handleLogin}>Login</a>
  <a on:click={handleSignup}>Signup</a>
</nav>

<script lang="ts">
    import ECCM from 'ecc-messaging-scheme-package';
    import GithubLogin from "svelte-github-login";
	import { serverKey } from '../store.js';
	import { user } from '../store.js';

    let uuid: string;
    let password: string;

    async function handleLogin() {
        await generateSharedKeyWithUser();
    }

    async function generateSharedKeyWithUser() {
        const key = await serverKey.get();
        const uuidECC = new ECCM(uuid);
        return uuidECC.generateSharedKey(key);
    }
</script>

<nav>
    <GithubLogin
        clientId="Iv1.49a4894cc424a43a"
        scope="user:email"
        redirectUri="https://ecc-messaging-demo.surge.sh/"
        on:success={params => console.log(params)}
        on:error={error => console.log(error)}
        let:onLogin
    >
        <button on:click={onLogin}>Github Login</button>
    </GithubLogin>
</nav>

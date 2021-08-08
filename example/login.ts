/**
 * Created by archethic on 2021/08/06
 */
import { ApiClient, KakaoLinkClient } from "../index";

const CLIENT = new KakaoLinkClient();

async function main() {
    const api = await ApiClient.create('apiKey', 'url');
    const loginRes = await api.login({
        email: 'email',
        password: 'password',
        keeplogin: true
    });
    if(!loginRes.success) throw new Error(`Login Failed with status: ${loginRes.status} and message: ${loginRes.message}`);
    console.log('[+] Kakao Link Auth Login Success!')

    CLIENT.login(loginRes.result);

    const send = await CLIENT.sendLink('roomName', {
        link_ver: '4.0',
        template_id: 12345,
        template_args: {
            title: 'node-kakaolink',
            desc: 'sendLink from nodeJS'
        }
    }, 'custom')

    console.log(`success: ${send.success} status: ${send.status}`);
}
main().then();
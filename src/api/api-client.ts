/**
 * Created by archethic on 2021/08/06
 */

import axios, { AxiosResponse } from "axios";
import axiosCookieJarSupport from "axios-cookiejar-support";
import { load } from "cheerio";
import { CookieJar } from "tough-cookie";
import { LinkConfig } from "../config";
import CryptoJS from 'crypto-js'
import { ProcessResponse } from "../request";
import { AuthStatusCode } from "../request/kakaolink-status";

axiosCookieJarSupport(axios)

export interface loginResult {
    readonly apiKey: string,
    readonly url: string,
    readonly cookieJar: CookieJar
}

export interface authenticateResponse {
    readonly status: AuthStatusCode | number,
    readonly message: string
}

export class ApiClient {
    #cookieJar: CookieJar;
    #loginRes: cheerio.Root;
    #apiKey: string;
    #url: string;
    constructor(cookie: CookieJar, loginRes:cheerio.Root, apiKey:string, url: string) {
        this.#cookieJar = cookie
        if(loginRes === undefined) throw new Error(`crypto key is not defined`);
        this.#loginRes = loginRes;
        this.#apiKey = apiKey;
        this.#url = url;
    }

    static async create(apiKey:string, url:string) {
        const cookieJar = new CookieJar();
        const getLoginRes = await axios({
            method: 'GET',
            url: LinkConfig.accountsUrl,
            headers: {
                Referer: 'https://accounts.kakao.com/'
            },
            jar: cookieJar,
            withCredentials: true,
        });
        if(getLoginRes.status !== 200) {
            throw new Error(`Kakao Accounts Load Failed with status: ${getLoginRes.status}`);
        }
        await axios({
            method: 'get',
            url: LinkConfig.getTiaraUrl,
            jar: cookieJar,
            withCredentials: true
        })
        const $ = load(getLoginRes.data)
        return new ApiClient(cookieJar, $, apiKey, url)
    }

    async login(loginParams: loginInterface): ProcessResponse<loginResult> {
        const cryptoKey = this.#loginRes('input[name=p]').attr('value')!.toString()
        const csrfToken = this.#loginRes('head > meta:nth-child(3)').attr('content')!.toString();
        const getAuthRes: AxiosResponse<authenticateResponse> = await axios({
            method: 'POST',
            url: LinkConfig.getAuthUrl,
            headers: {
                Referer: LinkConfig.accountsUrl,
            },
            data: {
                os: 'web',
                webview_v: '2',
                email: CryptoJS.AES.encrypt(loginParams.email, cryptoKey).toString(),
                password: CryptoJS.AES.encrypt(loginParams.password, cryptoKey).toString(),
                stay_signed_in: String(loginParams.keeplogin) || 'true',
                continue: decodeURIComponent(LinkConfig.accountsUrl.split('=')[1]),
                third: 'false',
                k: 'true',
                authenticty_token: csrfToken
            },
            jar: this.#cookieJar,
            withCredentials: true,
            responseType: 'json'
        })
        if(getAuthRes.data['status'] !== 0) {
            return {
                success: false,
                status: getAuthRes.data.status,
            }
        }
        return {
            success: true,
            status: getAuthRes.data.status,
            result: {
                apiKey: this.#apiKey,
                url: this.#url,
                cookieJar: this.#cookieJar
            }
        }
    }
}

interface loginInterface {
    email: string,
    password: string,
    cookieJar?: CookieJar,
    keeplogin?: boolean
}